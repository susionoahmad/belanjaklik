package main

import (
	"bufio"
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

// Product represents an internal/own product (Alfamind / BelanjaKlik)
type Product struct {
	ID                  string
	Name                string
	Slug                string
	Brand               string
	Barcode             string
	Description         string
	Unit                string
	Price               float64
	PromoPrice          float64
	IsPromo             int
	IsFeatured          int
	IsPopular           int
	IsAvailable         int
	StockStatus         string
	ThumbnailURL        string
	ImageURL            string
	Category            string
	SearchKeywords      string
	PurchaseMethod      string
	ExternalProductCode string
	ProductURL          string
	AffiliateURL        string
	CreatedAt           string
	UpdatedAt           string
}

// AffiliateProduct represents a product from Accesstrade datafeed
type AffiliateProduct struct {
	ID                string
	Source            string
	Merchant          string
	CampaignID        string
	SiteID            string
	SiteURL           string
	ExternalProductID string
	Name              string
	Slug              string
	Description       string
	ImageURL          string
	ProductURL        string
	AffiliateURL      string
	Price             float64
	OriginalPrice     float64
	DiscountPercent   float64
	CommissionRate    float64
	ShopName          string
	Category          string
	Brand             string
	ItemSold          int
	ItemRating        float64
	IsActive          int
	CreatedAt         string
	UpdatedAt         string
}

func main() {
	startTime := time.Now()
	log.Println("[GENERATOR] Starting SQLite Database Generation...")

	dbPath := "katalog.db"
	// Remove existing db file if any to start fresh
	if _, err := os.Stat(dbPath); err == nil {
		os.Remove(dbPath)
		os.Remove(dbPath + "-wal")
		os.Remove(dbPath + "-shm")
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Failed to open SQLite db: %v", err)
	}
	defer db.Close()

	// 1. Enable SQLite High-Performance Tuning PRAGMAs
	log.Println("[GENERATOR] Applying SQLite tuning PRAGMAs...")
	pragmas := []string{
		"PRAGMA journal_mode = WAL;",
		"PRAGMA synchronous = NORMAL;",
		"PRAGMA page_size = 4096;",
		"PRAGMA temp_store = MEMORY;",
		"PRAGMA cache_size = -64000;", // 64MB cache during build
	}
	for _, p := range pragmas {
		if _, err := db.Exec(p); err != nil {
			log.Fatalf("Failed to execute pragma (%s): %v", p, err)
		}
	}

	// 2. Create Schema
	log.Println("[GENERATOR] Creating Tables and Indexes...")
	createTables(db)

	// 3. Load .env config
	env := loadEnv()

	// 4. Import Data
	ownCount := importOwnProducts(db, env)
	affiliateCount := importAffiliateProducts(db, env)

	// 5. Create Unified View
	log.Println("[GENERATOR] Creating Unified VIEW `all_products`...")
	createUnifiedView(db)

	// Final Optimize & Checkpoint WAL
	db.Exec("PRAGMA optimize;")
	db.Exec("PRAGMA wal_checkpoint(FULL);")

	duration := time.Since(startTime)
	log.Printf("[GENERATOR] Successfully created %s in %v!", dbPath, duration)
	log.Printf("[GENERATOR] Total Own Products: %d", ownCount)
	log.Printf("[GENERATOR] Total Affiliate Products: %d", affiliateCount)
	log.Printf("[GENERATOR] Total Combined: %d", ownCount+affiliateCount)
}

func loadEnv() map[string]string {
	env := make(map[string]string)
	paths := []string{"../frontend/.env", ".env", "../../frontend/.env"}
	for _, p := range paths {
		f, err := os.Open(p)
		if err != nil {
			continue
		}
		defer f.Close()
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				env[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
			}
		}
		break
	}
	return env
}

func createTables(db *sql.DB) {
	schema := `
	DROP TABLE IF EXISTS products;
	DROP TABLE IF EXISTS affiliate_products;

	CREATE TABLE products (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		slug TEXT,
		brand TEXT,
		barcode TEXT,
		description TEXT,
		unit TEXT DEFAULT 'pcs',
		price REAL NOT NULL DEFAULT 0.0,
		promo_price REAL,
		is_promo INTEGER DEFAULT 0,
		is_featured INTEGER DEFAULT 0,
		is_popular INTEGER DEFAULT 0,
		is_available INTEGER DEFAULT 1,
		stock_status TEXT DEFAULT 'in_stock',
		thumbnail_url TEXT,
		image_url TEXT,
		category TEXT,
		search_keywords TEXT,
		purchase_method TEXT DEFAULT 'owner_checkout',
		external_product_code TEXT,
		product_url TEXT,
		affiliate_url TEXT,
		created_at TEXT DEFAULT (datetime('now')),
		updated_at TEXT DEFAULT (datetime('now')),
		deleted_at TEXT
	);

	CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
	CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
	CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
	CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
	CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

	CREATE TABLE IF NOT EXISTS affiliate_products (
		id TEXT PRIMARY KEY,
		source TEXT DEFAULT 'accesstrade',
		merchant TEXT,
		campaign_id TEXT,
		site_id TEXT DEFAULT 'legacy',
		site_url TEXT,
		external_product_id TEXT,
		name TEXT NOT NULL,
		slug TEXT,
		description TEXT,
		image_url TEXT,
		product_url TEXT,
		affiliate_url TEXT NOT NULL,
		price REAL DEFAULT 0.0,
		original_price REAL DEFAULT 0.0,
		discount_percent REAL DEFAULT 0.0,
		commission_rate REAL DEFAULT 0.0,
		shop_name TEXT,
		category TEXT,
		brand TEXT,
		item_sold INTEGER DEFAULT 0,
		item_rating REAL DEFAULT 0.0,
		is_active INTEGER DEFAULT 1,
		created_at TEXT DEFAULT (datetime('now')),
		updated_at TEXT DEFAULT (datetime('now'))
	);

	CREATE INDEX IF NOT EXISTS idx_affiliate_name ON affiliate_products(name);
	CREATE INDEX IF NOT EXISTS idx_affiliate_category ON affiliate_products(category);
	CREATE INDEX IF NOT EXISTS idx_affiliate_merchant ON affiliate_products(merchant);
	CREATE INDEX IF NOT EXISTS idx_affiliate_brand ON affiliate_products(brand);
	CREATE INDEX IF NOT EXISTS idx_affiliate_price ON affiliate_products(price);
	CREATE INDEX IF NOT EXISTS idx_affiliate_active ON affiliate_products(is_active);
	`
	if _, err := db.Exec(schema); err != nil {
		log.Fatalf("Failed creating tables: %v", err)
	}
}

func createUnifiedView(db *sql.DB) {
	viewSQL := `
	DROP VIEW IF EXISTS all_products;
	CREATE VIEW all_products AS
	SELECT
		id,
		'own' AS product_type,
		name,
		slug,
		brand,
		category,
		description,
		image_url,
		thumbnail_url,
		product_url,
		affiliate_url,
		price,
		promo_price,
		is_promo,
		is_available AS is_active,
		stock_status,
		purchase_method,
		external_product_code,
		0 AS item_sold,
		0.0 AS item_rating,
		created_at
	FROM products
	WHERE deleted_at IS NULL OR deleted_at = ''

	UNION ALL

	SELECT
		id,
		'affiliate' AS product_type,
		name,
		slug,
		brand,
		category,
		description,
		image_url,
		image_url AS thumbnail_url,
		product_url,
		affiliate_url,
		price,
		original_price AS promo_price,
		CASE WHEN original_price > price THEN 1 ELSE 0 END AS is_promo,
		is_active,
		'in_stock' AS stock_status,
		'coming_soon' AS purchase_method,
		external_product_id AS external_product_code,
		item_sold,
		item_rating,
		created_at
	FROM affiliate_products
	WHERE is_active = 1;
	`
	if _, err := db.Exec(viewSQL); err != nil {
		log.Fatalf("Failed creating VIEW all_products: %v", err)
	}
}

func importOwnProducts(db *sql.DB, env map[string]string) int {
	log.Println("[GENERATOR] Importing own products...")

	var items []Product

	// 1. Try Supabase REST API if configured
	supabaseURL := env["VITE_SUPABASE_URL"]
	supabaseKey := env["SUPABASE_SERVICE_ROLE_KEY"]
	if supabaseKey == "" {
		supabaseKey = env["VITE_SUPABASE_ANON_KEY"]
	}

	if supabaseURL != "" && supabaseKey != "" {
		log.Printf("[GENERATOR] Attempting to import own products from Supabase API (%s)...", supabaseURL)
		items = fetchProductsFromSupabase(supabaseURL, supabaseKey)
		if len(items) > 0 {
			log.Printf("[GENERATOR] Successfully fetched %d own products from Supabase!", len(items))
		} else {
			log.Println("[GENERATOR] Supabase query returned 0 products or encountered error. Falling back to local CSV...")
		}
	}

	// 2. Fallback to local CSV files if Supabase gave 0 items
	if len(items) == 0 {
		candidates := []string{
			"../tools/product-filter/all_category_tokopedia.csv_FILTERED.csv",
			"../tools/product-filter/all_category_tokopedia.csv",
			"../tools/datafeed/CEK 1.csv",
			"../tools/datafeed/Supabase Snippet Untitled query.csv",
			"../product-filter/all_category_tokopedia.csv_FILTERED.csv",
			"product-filter/all_category_tokopedia.csv_FILTERED.csv",
		}

		var targetFile string
		for _, f := range candidates {
			if _, err := os.Stat(f); err == nil {
				targetFile = f
				break
			}
		}

		if targetFile != "" {
			log.Printf("[GENERATOR] Found own products CSV: %s", targetFile)
			items = parseOwnCSV(targetFile)
		}
	}

	// 3. Fallback to sample data if still empty
	if len(items) == 0 {
		log.Println("[GENERATOR] Generating sample seed products for own products...")
		for i := 1; i <= 50; i++ {
			items = append(items, Product{
				ID:             fmt.Sprintf("own-%05d", i),
				Name:           fmt.Sprintf("Produk BelanjaKlik Direct #%d", i),
				Slug:           fmt.Sprintf("produk-belanjaklik-direct-%d", i),
				Brand:          "BelanjaKlik Direct",
				Category:       "Sembako & Kebutuhan Rumah",
				Description:    "Produk pilihan terbaik untuk kebutuhan sehari-hari dengan harga paling hemat.",
				Unit:           "pcs",
				Price:          float64(10000 + i*1500),
				PromoPrice:     float64(9000 + i*1500),
				IsPromo:        1,
				IsAvailable:    1,
				StockStatus:    "in_stock",
				ImageURL:       "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500",
				ThumbnailURL:   "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200",
				PurchaseMethod: "owner_checkout",
				CreatedAt:      time.Now().Format(time.RFC3339),
			})
		}
	}

	tx, err := db.Begin()
	if err != nil {
		log.Fatalf("Failed to begin transaction for own products: %v", err)
	}

	stmt, err := tx.Prepare(`
	INSERT OR REPLACE INTO products (
		id, name, slug, brand, barcode, description, unit, price, promo_price,
		is_promo, is_featured, is_popular, is_available, stock_status, thumbnail_url,
		image_url, category, search_keywords, purchase_method, external_product_code,
		product_url, affiliate_url, created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		log.Fatalf("Failed to prepare statement: %v", err)
	}
	defer stmt.Close()

	batchSize := 1000
	count := 0

	for _, item := range items {
		_, err := stmt.Exec(
			item.ID, item.Name, item.Slug, item.Brand, item.Barcode, item.Description,
			item.Unit, item.Price, item.PromoPrice, item.IsPromo, item.IsFeatured,
			item.IsPopular, item.IsAvailable, item.StockStatus, item.ThumbnailURL,
			item.ImageURL, item.Category, item.SearchKeywords, item.PurchaseMethod,
			item.ExternalProductCode, item.ProductURL, item.AffiliateURL,
			item.CreatedAt, item.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error inserting product %s: %v", item.ID, err)
			continue
		}
		count++

		if count%batchSize == 0 {
			stmt.Close()
			if err := tx.Commit(); err != nil {
				log.Fatalf("Transaction commit failed: %v", err)
			}
			tx, _ = db.Begin()
			stmt, _ = tx.Prepare(`
			INSERT OR REPLACE INTO products (
				id, name, slug, brand, barcode, description, unit, price, promo_price,
				is_promo, is_featured, is_popular, is_available, stock_status, thumbnail_url,
				image_url, category, search_keywords, purchase_method, external_product_code,
				product_url, affiliate_url, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`)
		}
	}

	if err := tx.Commit(); err != nil {
		log.Fatalf("Final transaction commit failed: %v", err)
	}

	return count
}

func fetchProductsFromSupabase(baseURL, key string) []Product {
	url := fmt.Sprintf("%s/rest/v1/products?select=*&is.deleted_at=null&limit=5000", strings.TrimSuffix(baseURL, "/"))
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil
	}
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", "Bearer "+key)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		if resp != nil {
			log.Printf("Supabase API returned status %d", resp.StatusCode)
		}
		return nil
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	var rawList []map[string]interface{}
	if err := json.Unmarshal(body, &rawList); err != nil {
		return nil
	}

	var list []Product
	for _, raw := range rawList {
		getString := func(key string) string {
			if v, ok := raw[key]; ok && v != nil {
				return fmt.Sprintf("%v", v)
			}
			return ""
		}
		getFloat := func(key string) float64 {
			if v, ok := raw[key]; ok && v != nil {
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
		getBool := func(key string) int {
			if v, ok := raw[key]; ok && v != nil {
				if b, ok := v.(bool); ok && b {
					return 1
				}
			}
			return 0
		}

		id := getString("id")
		name := getString("name")
		if name == "" {
			continue
		}

		list = append(list, Product{
			ID:                  id,
			Name:                name,
			Slug:                getString("slug"),
			Brand:               getString("brand"),
			Barcode:             getString("barcode"),
			Description:         getString("description"),
			Unit:                getString("unit"),
			Price:               getFloat("price"),
			PromoPrice:          getFloat("promo_price"),
			IsPromo:             getBool("is_promo"),
			IsFeatured:          getBool("is_featured"),
			IsPopular:           getBool("is_popular"),
			IsAvailable:         1,
			StockStatus:         "in_stock",
			ThumbnailURL:        getString("thumbnail_url"),
			ImageURL:            getString("image_url"),
			Category:            getString("category"),
			PurchaseMethod:      getString("purchase_method"),
			ExternalProductCode: getString("external_product_code"),
			CreatedAt:           getString("created_at"),
			UpdatedAt:           getString("updated_at"),
		})
	}
	return list
}

func importAffiliateProducts(db *sql.DB, env map[string]string) int {
	log.Println("[GENERATOR] Importing affiliate products (Accestrade)...")

	var items []AffiliateProduct

	// 1. Try Supabase REST API if configured
	supabaseURL := env["VITE_SUPABASE_URL"]
	supabaseKey := env["SUPABASE_SERVICE_ROLE_KEY"]
	if supabaseKey == "" {
		supabaseKey = env["VITE_SUPABASE_ANON_KEY"]
	}

	if supabaseURL != "" && supabaseKey != "" {
		log.Printf("[GENERATOR] Attempting to import affiliate products from Supabase API (%s)...", supabaseURL)
		items = fetchAffiliateProductsFromSupabase(supabaseURL, supabaseKey)
		if len(items) > 0 {
			log.Printf("[GENERATOR] Successfully fetched %d affiliate products from Supabase!", len(items))
		} else {
			log.Println("[GENERATOR] Supabase query returned 0 affiliate products or table doesn't exist yet. Falling back to local CSV...")
		}
	}

	// 2. Fallback to local CSV files if Supabase gave 0 items
	if len(items) == 0 {
		candidates := []string{
			"../tools/product-filter/product_list_966_20260727_FILTERED.csv",
			"../tools/product-filter/product_list_966_20260804.CSV",
			"../tools/product-filter/product_list_966_20260727.CSV",
			"../product-filter/product_list_966_20260727_FILTERED.csv",
			"product-filter/product_list_966_20260727_FILTERED.csv",
		}

		var targetFile string
		for _, f := range candidates {
			if _, err := os.Stat(f); err == nil {
				targetFile = f
				break
			}
		}

		if targetFile != "" {
			log.Printf("[GENERATOR] Found Accestrade CSV: %s", targetFile)
			items = parseAffiliateCSV(targetFile)
		}
	}

	// 3. Ensure Tokopedia items exist in affiliate catalog
	tokopediaCount := 0
	for _, item := range items {
		if strings.ToLower(item.Merchant) == "tokopedia" {
			tokopediaCount++
		}
	}
	if tokopediaCount == 0 {
		log.Println("[GENERATOR] Supplementing Tokopedia products into affiliate_products table...")
		tokopediaItems := parseTokopediaAffiliateCSV("../tools/product-filter/all_category_tokopedia.csv_FILTERED.csv")
		if len(tokopediaItems) == 0 {
			tokopediaItems = parseTokopediaAffiliateCSV("tools/product-filter/all_category_tokopedia.csv_FILTERED.csv")
		}
		items = append(items, tokopediaItems...)
	}

	// 4. Fallback to sample data if still empty
	if len(items) == 0 {
		log.Println("[GENERATOR] Generating sample seed affiliate products...")
		merchants := []string{"shopee", "tokopedia", "tiktok_shop"}
		for i := 1; i <= 500; i++ {
			merchant := merchants[i%len(merchants)]
			price := float64(15000 + (i * 2000))
			origPrice := price * 1.25
			items = append(items, AffiliateProduct{
				ID:                fmt.Sprintf("aff-%05d", i),
				Source:            "accesstrade",
				Merchant:          merchant,
				CampaignID:        "direct_csv",
				SiteID:            "legacy",
				ExternalProductID: fmt.Sprintf("ext-%d", i),
				Name:              fmt.Sprintf("Produk Affiliate %s Premium #%d", strings.Title(merchant), i),
				Slug:              fmt.Sprintf("produk-affiliate-%s-premium-%d", merchant, i),
				Description:       "Produk rekomendasi affiliate terbaik dengan promo diskon menarik dari seller pilihan.",
				ImageURL:          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
				ProductURL:        "https://example.com/product/" + strconv.Itoa(i),
				AffiliateURL:      "https://accesstrade.co.id/click?id=" + strconv.Itoa(i),
				Price:             price,
				OriginalPrice:     origPrice,
				DiscountPercent:   20.0,
				ShopName:          "Official Store " + strings.Title(merchant),
				Category:          "Gadget & Elektronik",
				Brand:             "Brand Official",
				ItemSold:          100 + i*5,
				ItemRating:        4.8,
				IsActive:          1,
				CreatedAt:         time.Now().Format(time.RFC3339),
				UpdatedAt:         time.Now().Format(time.RFC3339),
			})
		}
	}

	tx, err := db.Begin()
	if err != nil {
		log.Fatalf("Failed to begin transaction for affiliate products: %v", err)
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
		log.Fatalf("Failed to prepare statement: %v", err)
	}
	defer stmt.Close()

	batchSize := 1000
	count := 0

	for _, item := range items {
		_, err := stmt.Exec(
			item.ID, item.Source, item.Merchant, item.CampaignID, item.SiteID,
			item.SiteURL, item.ExternalProductID, item.Name, item.Slug, item.Description,
			item.ImageURL, item.ProductURL, item.AffiliateURL, item.Price, item.OriginalPrice,
			item.DiscountPercent, item.CommissionRate, item.ShopName, item.Category,
			item.Brand, item.ItemSold, item.ItemRating, item.IsActive, item.CreatedAt, item.UpdatedAt,
		)
		if err != nil {
			continue
		}
		count++

		if count%batchSize == 0 {
			stmt.Close()
			if err := tx.Commit(); err != nil {
				log.Fatalf("Transaction commit failed: %v", err)
			}
			tx, _ = db.Begin()
			stmt, _ = tx.Prepare(`
			INSERT OR REPLACE INTO affiliate_products (
				id, source, merchant, campaign_id, site_id, site_url, external_product_id,
				name, slug, description, image_url, product_url, affiliate_url, price,
				original_price, discount_percent, commission_rate, shop_name, category,
				brand, item_sold, item_rating, is_active, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`)
		}
	}

	if err := tx.Commit(); err != nil {
		log.Fatalf("Final transaction commit failed: %v", err)
	}

	return count
}

func fetchAffiliateProductsFromSupabase(baseURL, key string) []AffiliateProduct {
	url := fmt.Sprintf("%s/rest/v1/affiliate_products?select=*&is_active=eq.true&limit=5000", strings.TrimSuffix(baseURL, "/"))
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil
	}
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", "Bearer "+key)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return nil
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	var rawList []map[string]interface{}
	if err := json.Unmarshal(body, &rawList); err != nil {
		return nil
	}

	var list []AffiliateProduct
	for _, raw := range rawList {
		getString := func(key string) string {
			if v, ok := raw[key]; ok && v != nil {
				return fmt.Sprintf("%v", v)
			}
			return ""
		}
		getFloat := func(key string) float64 {
			if v, ok := raw[key]; ok && v != nil {
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
		getInt := func(key string) int {
			if v, ok := raw[key]; ok && v != nil {
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

		id := getString("id")
		name := getString("name")
		if name == "" {
			continue
		}

		list = append(list, AffiliateProduct{
			ID:                id,
			Source:            getString("source"),
			Merchant:          getString("merchant"),
			CampaignID:        getString("campaign_id"),
			SiteID:            getString("site_id"),
			SiteURL:           getString("site_url"),
			ExternalProductID: getString("external_product_id"),
			Name:              name,
			Slug:              getString("slug"),
			Description:       getString("description"),
			ImageURL:          getString("image_url"),
			ProductURL:        getString("product_url"),
			AffiliateURL:      getString("affiliate_url"),
			Price:             getFloat("price"),
			OriginalPrice:     getFloat("original_price"),
			DiscountPercent:   getFloat("discount_percent"),
			CommissionRate:    getFloat("commission_rate"),
			ShopName:          getString("shop_name"),
			Category:          getString("category"),
			Brand:             getString("brand"),
			ItemSold:          getInt("item_sold"),
			ItemRating:        getFloat("item_rating"),
			IsActive:          1,
			CreatedAt:         getString("created_at"),
			UpdatedAt:         getString("updated_at"),
		})
	}
	return list
}

func parseOwnCSV(filePath string) []Product {
	f, err := os.Open(filePath)
	if err != nil {
		return nil
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.LazyQuotes = true
	r.FieldsPerRecord = -1

	header, err := r.Read()
	if err != nil {
		return nil
	}

	colIdx := make(map[string]int)
	for i, h := range header {
		colIdx[strings.ToLower(strings.TrimSpace(h))] = i
	}

	var list []Product
	idCounter := 1

	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(rec) == 0 {
			continue
		}

		getVal := func(keys ...string) string {
			for _, k := range keys {
				if idx, ok := colIdx[strings.ToLower(k)]; ok && idx < len(rec) {
					val := strings.TrimSpace(rec[idx])
					if val != "" {
						return val
					}
				}
			}
			return ""
		}

		name := getVal("name", "product_name", "title", "nama_produk")
		if name == "" {
			continue
		}

		priceStr := getVal("price", "harga", "price_num")
		price, _ := strconv.ParseFloat(strings.ReplaceAll(priceStr, ",", ""), 64)

		id := getVal("id", "product_id")
		if id == "" {
			id = fmt.Sprintf("own-%d", idCounter)
			idCounter++
		}

		extCode := getVal("external_product_code", "plu", "sku", "code", "product_code")
		if extCode == "" {
			extCode = strings.TrimPrefix(id, "own-")
		}
		prodURL := getVal("product_url", "link", "url")
		if prodURL == "" && extCode != "" {
			prodURL = fmt.Sprintf("https://tokovirtualku.id/nessamart/detail/%s", extCode)
		}

		list = append(list, Product{
			ID:                  id,
			Name:                name,
			Slug:                slugify(name),
			Brand:               getVal("brand", "merk"),
			Category:            getVal("category", "kategori"),
			Description:         getVal("description", "deskripsi"),
			Unit:                "pcs",
			Price:               price,
			IsAvailable:         1,
			StockStatus:         "in_stock",
			ImageURL:            getVal("image_url", "image", "foto"),
			ThumbnailURL:        getVal("thumbnail_url", "image_url"),
			PurchaseMethod:      "alfamind_tokosaya",
			ExternalProductCode: extCode,
			ProductURL:          prodURL,
			CreatedAt:           time.Now().Format(time.RFC3339),
			UpdatedAt:           time.Now().Format(time.RFC3339),
		})
	}

	return list
}

func parseAffiliateCSV(filePath string) []AffiliateProduct {
	f, err := os.Open(filePath)
	if err != nil {
		return nil
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.LazyQuotes = true
	r.FieldsPerRecord = -1

	header, err := r.Read()
	if err != nil {
		return nil
	}

	colIdx := make(map[string]int)
	for i, h := range header {
		colIdx[strings.ToLower(strings.TrimSpace(h))] = i
	}

	var list []AffiliateProduct
	idCounter := 1

	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(rec) == 0 {
			continue
		}

		getVal := func(keys ...string) string {
			for _, k := range keys {
				if idx, ok := colIdx[strings.ToLower(k)]; ok && idx < len(rec) {
					val := strings.TrimSpace(rec[idx])
					if val != "" {
						return val
					}
				}
			}
			return ""
		}

		name := getVal("merchant product name", "name", "product_name")
		if name == "" {
			continue
		}

		priceStr := getVal("price", "discounted price", "discounted_price")
		price, _ := strconv.ParseFloat(strings.ReplaceAll(priceStr, ",", ""), 64)

		origPriceStr := getVal("price", "original_price")
		origPrice, _ := strconv.ParseFloat(strings.ReplaceAll(origPriceStr, ",", ""), 64)

		affURL := getVal("affiliate url", "tracking url", "affiliate_url", "product url web (encoded)", "product_url")
		prodURL := getVal("product url web (encoded)", "product url", "product_url")

		itemSold, _ := strconv.Atoi(getVal("item_sold", "terjual"))
		rating, _ := strconv.ParseFloat(getVal("item_rating", "rating"), 64)

		id := getVal("merchant product id", "external_product_id")
		if id == "" {
			id = fmt.Sprintf("aff-%d", idCounter)
		}

		merchant := getVal("merchant", "source")
		if merchant == "" {
			merchant = "shopee"
		}

		list = append(list, AffiliateProduct{
			ID:                fmt.Sprintf("aff-%d-%s", idCounter, id),
			Source:            "accesstrade",
			Merchant:          merchant,
			CampaignID:        "direct_csv",
			SiteID:            "legacy",
			ExternalProductID: id,
			Name:              name,
			Slug:              slugify(name),
			Description:       getVal("description", "deskripsi"),
			ImageURL:          getVal("image url", "image_url"),
			ProductURL:        prodURL,
			AffiliateURL:      affURL,
			Price:             price,
			OriginalPrice:     origPrice,
			Category:          getVal("category name", "category", "sub category name"),
			Brand:             getVal("brand"),
			ItemSold:          itemSold,
			ItemRating:        rating,
			IsActive:          1,
			CreatedAt:         time.Now().Format(time.RFC3339),
			UpdatedAt:         time.Now().Format(time.RFC3339),
		})
		idCounter++
	}

	return list
}

func parseTokopediaAffiliateCSV(filePath string) []AffiliateProduct {
	f, err := os.Open(filePath)
	if err != nil {
		return nil
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.LazyQuotes = true
	r.FieldsPerRecord = -1

	header, err := r.Read()
	if err != nil {
		return nil
	}

	colIdx := make(map[string]int)
	for i, h := range header {
		colIdx[strings.ToLower(strings.TrimSpace(h))] = i
	}

	var list []AffiliateProduct
	idCounter := 1

	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(rec) == 0 {
			continue
		}

		getVal := func(keys ...string) string {
			for _, k := range keys {
				if idx, ok := colIdx[strings.ToLower(k)]; ok && idx < len(rec) {
					val := strings.TrimSpace(rec[idx])
					if val != "" {
						return val
					}
				}
			}
			return ""
		}

		name := getVal("name", "product_name", "title", "nama_produk")
		if name == "" {
			continue
		}

		priceStr := getVal("price", "harga", "price_num")
		price, _ := strconv.ParseFloat(strings.ReplaceAll(priceStr, ",", ""), 64)

		id := getVal("id", "product_id")
		if id == "" {
			id = fmt.Sprintf("tokope-%d", idCounter)
			idCounter++
		} else {
			id = "tokope-" + id
		}

		imgURL := getVal("image_url", "image", "foto")
		prodURL := getVal("product_url", "link", "url")
		if prodURL == "" {
			prodURL = fmt.Sprintf("https://www.tokopedia.com/search?st=product&q=%s", slugify(name))
		}

		list = append(list, AffiliateProduct{
			ID:                id,
			Source:            "accesstrade",
			Merchant:          "tokopedia",
			CampaignID:        "tokopedia_feed",
			SiteID:            "legacy",
			ExternalProductID: id,
			Name:              name,
			Slug:              slugify(name),
			Description:       getVal("description", "deskripsi"),
			ImageURL:          imgURL,
			ProductURL:        prodURL,
			AffiliateURL:      prodURL,
			Price:             price,
			OriginalPrice:     price,
			Category:          getVal("category", "kategori"),
			Brand:             getVal("brand", "merk"),
			ShopName:          "Tokopedia Official",
			ItemSold:          185,
			ItemRating:        4.8,
			IsActive:          1,
			CreatedAt:         time.Now().Format(time.RFC3339),
			UpdatedAt:         time.Now().Format(time.RFC3339),
		})

		if len(list) >= 250 {
			break
		}
	}

	return list
}

func slugify(s string) string {
	s = strings.ToLower(s)
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		} else if r == ' ' || r == '-' || r == '_' {
			b.WriteRune('-')
		}
	}
	res := b.String()
	for strings.Contains(res, "--") {
		res = strings.ReplaceAll(res, "--", "-")
	}
	return strings.Trim(res, "-")
}
