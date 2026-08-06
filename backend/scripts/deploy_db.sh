#!/bin/bash

# ==============================================================================
# deploy_db.sh - Auto-Deploy & Atomic Database Swap for BelanjaKlik (GCP VM)
# ==============================================================================
# File ini meng-upload file katalog.db dari komputer lokal / CI-CD runner ke VM GCP
# dan melakukan Atomic Rename (mv) agar zero-downtime saat update database.
# ==============================================================================

set -e # Exit immediately if a command fails

# KONFIGURASI SERVER GCP VM (Dapat disesuaikan atau di-override via Environment Variables)
GCP_USER="${GCP_USER:-ubuntu}"
GCP_HOST="${GCP_HOST:-104.198.xxx.xxx}" # Masukkan IP VM GCP atau Domain backend
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"     # Path SSH Private Key
REMOTE_DIR="${REMOTE_DIR:-/var/www/belanjaklik}"
LOCAL_DB="katalog.db"
REMOTE_TEMP_DB="${REMOTE_DIR}/katalog_temp.db"
REMOTE_FINAL_DB="${REMOTE_DIR}/katalog.db"

echo "=================================================================="
echo "🚀 [DEPLOY] Starting BelanjaKlik SQLite Database Auto-Deploy"
echo "=================================================================="

# 1. Pastikan file database lokal ada
if [ ! -f "$LOCAL_DB" ]; then
    echo "⚠️ [ERROR] File $LOCAL_DB tidak ditemukan di direktori saat ini!"
    echo "👉 Jalankan 'go run cmd/generator/main.go' terlebih dahulu."
    exit 1
fi

DB_SIZE=$(du -h "$LOCAL_DB" | cut -f1)
echo "📦 [INFO] Ukuran File Database Lokal ($LOCAL_DB): $DB_SIZE"

# 2. Upload file DB ke GCP VM sebagai file sementara (katalog_temp.db)
echo "⬆️ [UPLOAD] Uploading $LOCAL_DB -> $GCP_USER@$GCP_HOST:$REMOTE_TEMP_DB ..."

if command -v rsync &> /dev/null; then
    rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" "$LOCAL_DB" "$GCP_USER@$GCP_HOST:$REMOTE_TEMP_DB"
else
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$LOCAL_DB" "$GCP_USER@$GCP_HOST:$REMOTE_TEMP_DB"
fi

# 3. Lakukan Atomic Swap di Remote Server
echo "🔄 [SWAP] Executing Atomic Rename (mv katalog_temp.db -> katalog.db) on remote server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$GCP_USER@$GCP_HOST" << EOF
    sudo mkdir -p $REMOTE_DIR
    sudo chown -R $GCP_USER:$GCP_USER $REMOTE_DIR
    mv -f $REMOTE_TEMP_DB $REMOTE_FINAL_DB
    echo "✅ [REMOTE] Atomic swap completed successfully!"
EOF

echo "=================================================================="
echo "🎉 [SUCCESS] Deployment selesai! DB aktif di server GCP."
echo "=================================================================="
