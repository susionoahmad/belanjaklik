package main

import (
	"bytes"
	"compress/gzip"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	_ "modernc.org/sqlite"
)

var db *sql.DB
var startTime time.Time

// ProductItem represents the unified product JSON output
type ProductItem struct {
	ID                  string  `json:"id"`
	ProductType         string  `json:"product_type"` // "own" or "affiliate"
	Name                string  `json:"name"`
	Slug                string  `json:"slug"`
	Brand               string  `json:"brand"`
	Category            string  `json:"category"`
	Description         string  `json:"description"`
	ImageURL            string  `json:"image_url"`
	ThumbnailURL        string  `json:"thumbnail_url"`
	ProductURL          string  `json:"product_url"`
	AffiliateURL        string  `json:"affiliate_url"`
	Price               float64 `json:"price"`
	PromoPrice          float64 `json:"promo_price"`
	IsPromo             bool    `json:"is_promo"`
	IsActive            bool    `json:"is_active"`
	StockStatus         string  `json:"stock_status"`
	PurchaseMethod      string  `json:"purchase_method"`
	ExternalProductCode string  `json:"external_product_code"`
	ItemSold            int     `json:"item_sold"`
	ItemRating          float64 `json:"item_rating"`
	CreatedAt           string  `json:"created_at"`
}

// StoreProfile contains the public store contact data used for WhatsApp orders.
type StoreProfile struct {
	Name          string `json:"name"`
	Phone         string `json:"phone"`
	Owner         string `json:"owner"`
	Address       string `json:"address"`
	BusinessHours string `json:"business_hours"`
	DeliveryInfo  string `json:"delivery_info"`
}

type AdminUser struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	IsActive bool   `json:"is_active"`
}

const passwordIterations = 120000
const adminSessionDays = 7

// APIResponse represents standard pagination metadata response
type APIResponse struct {
	Status     string        `json:"status"`
	Total      int           `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"total_pages"`
	Data       []ProductItem `json:"data"`
}

func main() {
	startTime = time.Now()
	log.Println("[API-SERVER] Starting BelanjaKlik High-Performance Go Backend...")

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "katalog.db"
	}

	var err error
	// Open SQLite database in read-write mode for catalog settings updates
	connStr := fmt.Sprintf("file:%s?_journal_mode=WAL", dbPath)
	db, err = sql.Open("sqlite", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to SQLite (%s): %v", dbPath, err)
	}
	defer db.Close()

	// Connection Pool Settings as specified
	db.SetMaxOpenConns(100)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(0) // Keep connections open indefinitely

	// Verify connection
	if err := db.Ping(); err != nil {
		log.Printf("Warning: SQLite ping failed (%v). Ensure DB file exists at %s", err, dbPath)
	}

	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, description TEXT, updated_at TEXT)`); err != nil {
		log.Fatalf("Failed to initialize settings table: %v", err)
	}

	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS admin_users (
		id TEXT PRIMARY KEY,
		email TEXT NOT NULL UNIQUE COLLATE NOCASE,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL DEFAULT 'admin',
		is_active INTEGER NOT NULL DEFAULT 1,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	)`); err != nil {
		log.Fatalf("Failed to initialize admin_users table: %v", err)
	}
	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS admin_sessions (
		token_hash TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		expires_at TEXT NOT NULL,
		created_at TEXT NOT NULL,
		last_seen_at TEXT NOT NULL
	)`); err != nil {
		log.Fatalf("Failed to initialize admin_sessions table: %v", err)
	}
	if err := ensureDefaultAdmin(); err != nil {
		log.Fatalf("Failed to initialize default admin: %v", err)
	}

	// Clean duplicate affiliate products if any exist from previous test runs
	if _, err := db.Exec(`DELETE FROM affiliate_products WHERE rowid NOT IN (
		SELECT MAX(rowid) FROM affiliate_products GROUP BY LOWER(TRIM(COALESCE(merchant, ''))), LOWER(TRIM(name))
	)`); err != nil {
		log.Printf("[API-SERVER] Warning: duplicate cleanup failed: %v", err)
	}

	// Router setup
	mux := http.NewServeMux()
	mux.HandleFunc("/", handleRoot)
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/v1/health", handleHealth)
	mux.HandleFunc("/api/v1/products", handleProductsRouter)
	mux.HandleFunc("/api/v1/affiliate-products", handleAffiliateProducts)
	mux.HandleFunc("/api/v1/affiliate-product", handleAffiliateProducts)
	mux.HandleFunc("/api/v1/categories", handleCategories)
	mux.HandleFunc("/api/v1/store-profile", handleStoreProfile)
	mux.HandleFunc("/api/v1/admin/login", handleAdminLogin)
	mux.HandleFunc("/api/v1/admin/logout", handleAdminLogout)
	mux.HandleFunc("/api/v1/admin/me", handleAdminMe)

	// Apply Middlewares: CORS -> Gzip -> Cache Headers
	handler := middlewareCORS(middlewareCacheControl(middlewareGzip(mux)))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown handling
	go func() {
		log.Printf("[API-SERVER] Server listening on http://0.0.0.0:%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server Listen error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("[API-SERVER] Shutting down gracefully...")
}

// -------------------------------------------------------------
// HTTP HANDLERS
// -------------------------------------------------------------

func handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		respondJSON(w, http.StatusNotFound, map[string]string{"error": "Endpoint not found"})
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "online",
		"service":   "BelanjaKlik High-Performance Go Backend API",
		"version":   "1.0.0",
		"endpoints": []string{"/health", "/api/v1/health", "/api/v1/products", "/api/v1/affiliate-products", "/api/v1/categories"},
	})
}

func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	digest := sha256.Sum256(append(salt, []byte(password)...))
	result := digest[:]
	for i := 1; i < passwordIterations; i++ {
		next := sha256.Sum256(append(append([]byte{}, result...), append(salt, []byte(password)...)...))
		result = next[:]
	}
	return fmt.Sprintf("sha256$%d$%s$%s", passwordIterations, hex.EncodeToString(salt), hex.EncodeToString(result)), nil
}

func verifyPassword(password, encoded string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 4 || parts[0] != "sha256" {
		return false
	}
	iterations, err := strconv.Atoi(parts[1])
	salt, errSalt := hex.DecodeString(parts[2])
	expected, errExpected := hex.DecodeString(parts[3])
	if err != nil || errSalt != nil || errExpected != nil || iterations < 10000 || len(expected) != sha256.Size {
		return false
	}
	digest := sha256.Sum256(append(salt, []byte(password)...))
	result := digest[:]
	for i := 1; i < iterations; i++ {
		next := sha256.Sum256(append(append([]byte{}, result...), append(salt, []byte(password)...)...))
		result = next[:]
	}
	return subtle.ConstantTimeCompare(result, expected) == 1
}

func hashSessionToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func newSessionToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func ensureDefaultAdmin() error {
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM admin_users").Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	email := strings.TrimSpace(strings.ToLower(os.Getenv("ADMIN_EMAIL")))
	password := os.Getenv("ADMIN_PASSWORD")
	if email == "" || len(password) < 12 {
		log.Printf("[API-SERVER] No default admin created. Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) before first production start.")
		return nil
	}
	hash, err := hashPassword(password)
	if err != nil {
		return err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	_, err = db.Exec("INSERT INTO admin_users (id, email, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, 'admin', 1, ?, ?)", "admin-"+hashSessionToken(email)[:16], email, hash, now, now)
	if err == nil {
		log.Printf("[API-SERVER] Default admin created for %s", email)
	}
	return err
}

func authenticatedAdmin(r *http.Request) (AdminUser, bool) {
	var empty AdminUser
	auth := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(auth, "Bearer ") {
		return empty, false
	}
	tokenHash := hashSessionToken(strings.TrimSpace(strings.TrimPrefix(auth, "Bearer ")))
	var user AdminUser
	var expires string
	err := db.QueryRow(`SELECT u.id, u.email, u.role, u.is_active, s.expires_at
		FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
		WHERE s.token_hash = ?`, tokenHash).Scan(&user.ID, &user.Email, &user.Role, &user.IsActive, &expires)
	if err != nil || !user.IsActive {
		return empty, false
	}
	expiresAt, err := time.Parse(time.RFC3339, expires)
	if err != nil || time.Now().UTC().After(expiresAt) {
		return empty, false
	}
	_, _ = db.Exec("UPDATE admin_sessions SET last_seen_at = ? WHERE token_hash = ?", time.Now().UTC().Format(time.RFC3339), tokenHash)
	return user, true
}

func handleAdminLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 64*1024)).Decode(&input); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid login payload"})
		return
	}
	var user AdminUser
	var passwordHash string
	err := db.QueryRow("SELECT id, email, role, is_active, password_hash FROM admin_users WHERE email = ?", strings.TrimSpace(strings.ToLower(input.Email))).Scan(&user.ID, &user.Email, &user.Role, &user.IsActive, &passwordHash)
	if err != nil || !user.IsActive || !verifyPassword(input.Password, passwordHash) {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "email atau password salah"})
		return
	}
	token, err := newSessionToken()
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "gagal membuat sesi"})
		return
	}
	now := time.Now().UTC()
	_, err = db.Exec("INSERT INTO admin_sessions (token_hash, user_id, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)", hashSessionToken(token), user.ID, now.AddDate(0, 0, adminSessionDays).Format(time.RFC3339), now.Format(time.RFC3339), now.Format(time.RFC3339))
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "gagal menyimpan sesi"})
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "token": token, "user": user})
}

func handleAdminLogout(w http.ResponseWriter, r *http.Request) {
	if auth := strings.TrimSpace(strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")); auth != "" {
		_, _ = db.Exec("DELETE FROM admin_sessions WHERE token_hash = ?", hashSessionToken(auth))
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "success"})
}

func handleAdminMe(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedAdmin(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "user": user})
}

func defaultStoreProfile() StoreProfile {
	return StoreProfile{
		Name:          "BelanjaKlik Marketplace",
		Phone:         "6281234567890",
		Owner:         "Admin BelanjaKlik",
		Address:       "Jakarta, Indonesia",
		BusinessHours: "07:00 - 21:00 WIB",
		DeliveryInfo:  "Pengiriman gratis radius 3 km dengan minimal pemesanan Rp 50.000",
	}
}

func handleStoreProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		profile := defaultStoreProfile()
		var raw string
		err := db.QueryRow("SELECT value FROM settings WHERE key = 'store_profile'").Scan(&raw)
		if err == nil && raw != "" {
			if decodeErr := json.Unmarshal([]byte(raw), &profile); decodeErr != nil {
				log.Printf("[API-SERVER] Invalid store_profile setting: %v", decodeErr)
			}
		} else if err != sql.ErrNoRows && err != nil {
			respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		respondJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "data": profile})
		return
	}

	if _, ok := authenticatedAdmin(r); !ok {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "admin authentication required"})
		return
	}
	if r.Method != http.MethodPut && r.Method != http.MethodPost {
		w.Header().Set("Allow", "GET, PUT, POST, OPTIONS")
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	var profile StoreProfile
	decoder := json.NewDecoder(io.LimitReader(r.Body, 64*1024))
	if err := decoder.Decode(&profile); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid profile payload"})
		return
	}
	profile.Phone = strings.TrimSpace(profile.Phone)
	if profile.Name == "" || profile.Phone == "" {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "name and phone are required"})
		return
	}

	raw, err := json.Marshal(profile)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	_, err = db.Exec(`INSERT INTO settings (key, value, description, updated_at)
		VALUES ('store_profile', ?, 'Profil toko & nomor kontak WhatsApp', ?)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value, description = excluded.description, updated_at = excluded.updated_at`, string(raw), time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "data": profile})
}
func handleCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT DISTINCT category FROM all_products WHERE category IS NOT NULL AND category != '' ORDER BY category ASC")
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	var categories []string
	for rows.Next() {
		var cat string
		if err := rows.Scan(&cat); err == nil {
			categories = append(categories, cat)
		}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "data": categories})
}

func handleAffiliateProducts(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost || r.Method == http.MethodPut {
		var items []map[string]interface{}
		bodyBytes, err := io.ReadAll(io.LimitReader(r.Body, 10*1024*1024))
		if err != nil {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "failed reading request body"})
			return
		}
		bodyBytes = bytes.TrimSpace(bodyBytes)
		if len(bodyBytes) == 0 {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "empty payload"})
			return
		}

		if bodyBytes[0] == '[' {
			if err := json.Unmarshal(bodyBytes, &items); err != nil {
				respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json array: " + err.Error()})
				return
			}
		} else {
			var single map[string]interface{}
			if err := json.Unmarshal(bodyBytes, &single); err != nil {
				respondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json object: " + err.Error()})
				return
			}
			items = append(items, single)
		}

		tx, err := db.Begin()
		if err != nil {
			respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		stmt, err := tx.Prepare(`
			INSERT OR REPLACE INTO affiliate_products (
				id, source, merchant, campaign_id, site_id, site_url, external_product_id,
				name, slug, description, image_url, product_url, affiliate_url, price,
				original_price, discount_percent, commission_rate, shop_name, category,
				brand, item_sold, item_rating, is_active, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`)
		if err != nil {
			tx.Rollback()
			respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		defer stmt.Close()

		now := time.Now().UTC().Format(time.RFC3339)
		successCount := 0

		for _, item := range items {
			getStr := func(k string) string {
				if v, ok := item[k]; ok && v != nil {
					return fmt.Sprintf("%v", v)
				}
				return ""
			}
			getFloat := func(k string) float64 {
				if v, ok := item[k]; ok && v != nil {
					switch val := v.(type) {
					case float64:
						return val
					case string:
						f, _ := strconv.ParseFloat(val, 64)
						return f
					}
				}
				return 0.0
			}
			getInt := func(k string) int {
				if v, ok := item[k]; ok && v != nil {
					switch val := v.(type) {
					case float64:
						return int(val)
					case string:
						i, _ := strconv.Atoi(val)
						return i
					}
				}
				return 0
			}

			name := getStr("name")
			if name == "" {
				continue
			}
			affURL := getStr("affiliate_url")
			if affURL == "" {
				affURL = getStr("product_url")
			}

			merchant := strings.ToLower(getStr("merchant"))
			urlLower := strings.ToLower(affURL + " " + getStr("product_url") + " " + name + " " + merchant)
			if strings.Contains(urlLower, "traveloka") {
				merchant = "traveloka"
			} else if strings.Contains(urlLower, "blibli") {
				merchant = "blibli"
			} else if strings.Contains(urlLower, "tokopedia") || strings.Contains(urlLower, "tokope") {
				merchant = "tokopedia"
			} else if strings.Contains(urlLower, "lazada") {
				merchant = "lazada"
			} else if strings.Contains(urlLower, "tiktok") {
				merchant = "tiktok_shop"
			} else if merchant == "" {
				merchant = "shopee"
			}

			extID := strings.TrimSpace(getStr("external_product_id"))
			slug := strings.TrimSpace(getStr("slug"))
			id := strings.TrimSpace(getStr("id"))
			if id == "" {
				if extID != "" {
					id = "aff-" + merchant + "-" + extID
				} else if slug != "" {
					id = "aff-" + slug
				} else {
					h := sha256.Sum256([]byte(merchant + "|" + name + "|" + affURL))
					id = "aff-" + merchant + "-" + hex.EncodeToString(h[:8])
				}
			}
			if len(id) > 90 {
				id = id[:90]
			}

			createdAt := getStr("created_at")
			if createdAt == "" {
				createdAt = now
			}

			_, err := stmt.Exec(
				id,
				getStr("source"),
				merchant,
				getStr("campaign_id"),
				getStr("site_id"),
				getStr("site_url"),
				getStr("external_product_id"),
				name,
				getStr("slug"),
				getStr("description"),
				getStr("image_url"),
				getStr("product_url"),
				affURL,
				getFloat("price"),
				getFloat("original_price"),
				getFloat("discount_percent"),
				getFloat("commission_rate"),
				getStr("shop_name"),
				getStr("category"),
				getStr("brand"),
				getInt("item_sold"),
				getFloat("item_rating"),
				1,
				createdAt,
				now,
			)
			if err == nil {
				successCount++
			}
		}

		if err := tx.Commit(); err != nil {
			respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}

		respondJSON(w, http.StatusOK, map[string]interface{}{
			"status":        "success",
			"success_count": successCount,
			"total":         len(items),
		})
		return
	}

	q := r.URL.Query()
	if r.Method == http.MethodDelete {
		id := q.Get("id")
		if id == "" {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "id parameter required"})
			return
		}
		_, err := db.Exec("DELETE FROM affiliate_products WHERE id = ?", id)
		if err != nil {
			respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		respondJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "deleted_id": id})
		return
	}

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 50
	}
	where := []string{}
	if q.Get("active") != "all" {
		where = append(where, "is_active = 1")
	}
	args := []interface{}{}

	if vertical := q.Get("vertical"); vertical != "" && vertical != "all" {
		switch vertical {
		case "digital":
			where = append(where, "(category LIKE '%digital%' OR category LIKE '%hosting%' OR category LIKE '%domain%' OR category LIKE '%software%' OR category LIKE '%paket data%' OR category LIKE '%pulsa%' OR category LIKE '%voucher%' OR name LIKE '%hosting%' OR name LIKE '%domain%' OR name LIKE '%vps%' OR name LIKE '%vpn%')")
		case "travel":
			where = append(where, "(category LIKE '%travel%' OR category LIKE '%hotel%' OR category LIKE '%tiket%' OR category LIKE '%pesawat%' OR category LIKE '%wisata%' OR LOWER(TRIM(COALESCE(merchant, ''))) IN ('traveloka', 'agoda'))")
		case "marketplace":
			where = append(where, "(LOWER(TRIM(COALESCE(merchant, ''))) IN ('shopee', 'tokopedia', 'blibli', 'lazada', 'tiktok', 'tiktok_shop', 'traveloka') OR merchant IS NULL OR TRIM(merchant) = '')")
		default:
			where = append(where, "category LIKE ?")
			args = append(args, "%"+vertical+"%")
		}
	}

	for _, field := range []string{"merchant", "category", "brand"} {
		if value := q.Get(field); value != "" && value != "all" {
			if field == "merchant" {
				where = append(where, "LOWER(TRIM(COALESCE(merchant, ''))) LIKE ?")
				args = append(args, "%"+strings.ToLower(value)+"%")
			} else if field == "category" {
				parts := strings.Split(value, ",")
				var catClauses []string
				for _, p := range parts {
					p = strings.TrimSpace(p)
					if p != "" {
						catClauses = append(catClauses, "LOWER(category) LIKE ?")
						args = append(args, "%"+strings.ToLower(p)+"%")
					}
				}
				if len(catClauses) > 0 {
					where = append(where, "("+strings.Join(catClauses, " OR ")+")")
				}
			} else {
				where = append(where, field+" = ?")
				args = append(args, value)
			}
		}
	}
	if value := q.Get("slug"); value != "" {
		where = append(where, "(slug = ? OR LOWER(slug) = ? OR id = ? OR slug LIKE ?)")
		args = append(args, value, strings.ToLower(value), value, "%"+value+"%")
	}
	if value := q.Get("search"); value != "" {
		where = append(where, "(name LIKE ? OR category LIKE ? OR shop_name LIKE ?)")
		term := "%" + value + "%"
		args = append(args, term, term, term)
	}
	whereSQL := ""

	if len(where) > 0 {
		whereSQL = " WHERE " + strings.Join(where, " AND ")
	}
	var total int
	if err := db.QueryRow("SELECT COUNT(*) FROM affiliate_products"+whereSQL, args...).Scan(&total); err != nil {
		respondJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	orderBy := "ORDER BY created_at DESC, id DESC"
	switch q.Get("sort") {
	case "sold":
		orderBy = "ORDER BY COALESCE(item_sold, 0) DESC, created_at DESC, id DESC"
	case "discount":
		orderBy = "ORDER BY COALESCE(discount_percent, 0) DESC, created_at DESC, id DESC"
	case "price_low":
		orderBy = "ORDER BY COALESCE(price, 0) ASC, created_at DESC, id DESC"
	case "price_high":
		orderBy = "ORDER BY COALESCE(price, 0) DESC, created_at DESC, id DESC"
	}
	query := "SELECT * FROM affiliate_products" + whereSQL + " " + orderBy + " LIMIT ? OFFSET ?"
	queryArgs := append(args, limit, (page-1)*limit)
	rows, err := db.Query(query, queryArgs...)
	if err != nil {
		respondJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()
	columns, _ := rows.Columns()
	data := []map[string]interface{}{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		pointers := make([]interface{}, len(columns))
		for i := range values {
			pointers[i] = &values[i]
		}
		if rows.Scan(pointers...) != nil {
			continue
		}
		item := map[string]interface{}{}
		for i, column := range columns {
			if bytes, ok := values[i].([]byte); ok {
				item[column] = string(bytes)
			} else {
				item[column] = values[i]
			}
		}
		data = append(data, item)
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"status": "success", "total": total, "page": page, "limit": limit, "total_pages": (total + limit - 1) / limit, "data": data})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	uptime := time.Since(startTime).String()

	var dbStatus string
	if err := db.Ping(); err == nil {
		dbStatus = "connected"
	} else {
		dbStatus = "error: " + err.Error()
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "ok",
		"service":   "belanjaklik-backend",
		"version":   "1.0.0",
		"uptime":    uptime,
		"database":  dbStatus,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// handleProductsRouter routes sub-paths under /api/v1/products
func handleProductsRouter(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/products")

	if path == "" || path == "/" {
		handleUnifiedProducts(w, r)
		return
	}

	parts := strings.Split(strings.Trim(path, "/"), "/")

	if len(parts) == 1 {
		switch parts[0] {
		case "own":
			handleTableProducts(w, r, "own")
			return
		case "affiliate":
			handleTableProducts(w, r, "affiliate")
			return
		}
	}

	if len(parts) == 2 {
		// GET /api/v1/products/:type/:id
		handleProductDetail(w, r, parts[0], parts[1])
		return
	}

	http.NotFound(w, r)
}

// handleUnifiedProducts handles GET /api/v1/products (VIEW `all_products`)
func handleUnifiedProducts(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	page, _ := strconv.Atoi(query.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit < 1 {
		limit = 20
	} else if limit > 10000 {
		limit = 10000
	}
	offset := (page - 1) * limit

	category := query.Get("category")
	search := query.Get("search")
	prodType := query.Get("type") // "own" or "affiliate"
	slug := query.Get("slug")

	var whereClauses []string
	var args []interface{}

	if slug != "" {
		whereClauses = append(whereClauses, "(slug = ? OR slug LIKE ?)")
		args = append(args, slug, "%"+slug+"%")
	}
	if category != "" {
		whereClauses = append(whereClauses, "category LIKE ?")
		args = append(args, "%"+category+"%")
	}
	if search != "" {
		whereClauses = append(whereClauses, "(name LIKE ? OR brand LIKE ? OR category LIKE ? OR description LIKE ?)")
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm, searchTerm)
	}
	if prodType != "" {
		whereClauses = append(whereClauses, "product_type = ?")
		args = append(args, prodType)
	}

	whereSQL := ""
	if len(whereClauses) > 0 {
		whereSQL = " WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Count Total
	countQuery := "SELECT COUNT(*) FROM all_products" + whereSQL
	var total int
	err := db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Database query error: " + err.Error()})
		return
	}

	// Select Items
	dataQuery := fmt.Sprintf(`
		SELECT id, product_type, name, coalesce(slug,''), coalesce(brand,''), coalesce(category,''),
		       coalesce(description,''), coalesce(image_url,''), coalesce(thumbnail_url,''),
		       coalesce(product_url,''), coalesce(affiliate_url,''), price, coalesce(promo_price,0),
		       is_promo, is_active, coalesce(stock_status,'in_stock'), coalesce(purchase_method,'owner_checkout'), coalesce(external_product_code,''),
		       item_sold, item_rating, coalesce(created_at,'')
		FROM all_products %s
		ORDER BY created_at DESC, id DESC
		LIMIT ? OFFSET ?
	`, whereSQL)

	fetchArgs := append(args, limit, offset)
	rows, err := db.Query(dataQuery, fetchArgs...)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed fetching data: " + err.Error()})
		return
	}
	defer rows.Close()

	products := []ProductItem{}
	for rows.Next() {
		var p ProductItem
		var isPromoInt, isActiveInt int
		err := rows.Scan(
			&p.ID, &p.ProductType, &p.Name, &p.Slug, &p.Brand, &p.Category,
			&p.Description, &p.ImageURL, &p.ThumbnailURL, &p.ProductURL, &p.AffiliateURL,
			&p.Price, &p.PromoPrice, &isPromoInt, &isActiveInt, &p.StockStatus, &p.PurchaseMethod, &p.ExternalProductCode,
			&p.ItemSold, &p.ItemRating, &p.CreatedAt,
		)
		if err != nil {
			log.Printf("Row scan error: %v", err)
			continue
		}
		p.IsPromo = isPromoInt == 1
		p.IsActive = isActiveInt == 1
		products = append(products, p)
	}

	totalPages := (total + limit - 1) / limit

	respondJSON(w, http.StatusOK, APIResponse{
		Status:     "success",
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
		Data:       products,
	})
}

// handleTableProducts handles GET /api/v1/products/own and GET /api/v1/products/affiliate
func handleTableProducts(w http.ResponseWriter, r *http.Request, targetType string) {
	// Add type param and delegate to unified products handler
	q := r.URL.Query()
	q.Set("type", targetType)
	r.URL.RawQuery = q.Encode()
	handleUnifiedProducts(w, r)
}

// handleProductDetail handles GET /api/v1/products/:type/:id
func handleProductDetail(w http.ResponseWriter, r *http.Request, prodType, id string) {
	query := `
		SELECT id, product_type, name, coalesce(slug,''), coalesce(brand,''), coalesce(category,''),
		       coalesce(description,''), coalesce(image_url,''), coalesce(thumbnail_url,''),
		       coalesce(product_url,''), coalesce(affiliate_url,''), price, coalesce(promo_price,0),
		       is_promo, is_active, coalesce(stock_status,'in_stock'), item_sold, item_rating, coalesce(created_at,'')
		FROM all_products
		WHERE product_type = ? AND id = ?
		LIMIT 1
	`

	var p ProductItem
	var isPromoInt, isActiveInt int
	err := db.QueryRow(query, prodType, id).Scan(
		&p.ID, &p.ProductType, &p.Name, &p.Slug, &p.Brand, &p.Category,
		&p.Description, &p.ImageURL, &p.ThumbnailURL, &p.ProductURL, &p.AffiliateURL,
		&p.Price, &p.PromoPrice, &isPromoInt, &isActiveInt, &p.StockStatus,
		&p.ItemSold, &p.ItemRating, &p.CreatedAt,
	)

	if err == sql.ErrNoRows {
		respondJSON(w, http.StatusNotFound, map[string]string{"error": "Product not found"})
		return
	} else if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Database error: " + err.Error()})
		return
	}

	p.IsPromo = isPromoInt == 1
	p.IsActive = isActiveInt == 1

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status": "success",
		"data":   p,
	})
}

func respondJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// -------------------------------------------------------------
// MIDDLEWARES
// -------------------------------------------------------------

// CORS Middleware
func middlewareCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Allow Vercel frontend domains, local dev, and belanjaklik.my.id
		if origin == "" || strings.Contains(origin, "belanjaklik") || strings.Contains(origin, "vercel.app") || strings.Contains(origin, "localhost") {
			if origin != "" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			}
		} else {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Cache-Control Header Middleware (Cloudflare Friendly)
func middlewareCacheControl(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Static/Read-only product catalog is highly cacheable
		if r.Method == http.MethodGet && r.URL.Path == "/api/v1/affiliate-products" {
			w.Header().Set("Cache-Control", "public, max-age=300, s-maxage=900, stale-while-revalidate=60")
		} else if r.Method == http.MethodGet && r.URL.Path != "/health" && r.URL.Path != "/api/v1/store-profile" {
			w.Header().Set("Cache-Control", "public, max-age=3600, s-maxage=86400")
		} else {
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		}
		next.ServeHTTP(w, r)
	})
}

// Gzip Compression Middleware
type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

func middlewareGzip(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}

		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()

		gzw := gzipResponseWriter{Writer: gz, ResponseWriter: w}
		next.ServeHTTP(gzw, r)
	})
}
