package main

import (
	"compress/gzip"
	"database/sql"
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
	// Open SQLite database in read-only mode for maximum performance & concurrency safety
	connStr := fmt.Sprintf("file:%s?mode=ro&_journal_mode=WAL", dbPath)
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

	// Router setup
	mux := http.NewServeMux()
	mux.HandleFunc("/", handleRoot)
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/v1/health", handleHealth)
	mux.HandleFunc("/api/v1/products", handleProductsRouter)
	mux.HandleFunc("/api/v1/affiliate-products", handleAffiliateProducts)
	mux.HandleFunc("/api/v1/affiliate-product", handleAffiliateProducts)
	mux.HandleFunc("/api/v1/categories", handleCategories)

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
	q := r.URL.Query()
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
			} else {
				where = append(where, field+" = ?")
				args = append(args, value)
			}
		}
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
	orderBy := "ORDER BY created_at DESC"
	if q.Get("merchant") == "" || q.Get("merchant") == "all" {
		orderBy = "ORDER BY (ROW_NUMBER() OVER (PARTITION BY merchant ORDER BY id ASC)), merchant ASC"
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

		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
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
		if r.Method == http.MethodGet && r.URL.Path != "/health" {
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
