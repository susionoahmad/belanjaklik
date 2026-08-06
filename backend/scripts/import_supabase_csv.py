#!/usr/bin/env python3
"""Import tools/supabase/*_rows.csv into a local SQLite catalog."""
from __future__ import annotations
import argparse, csv, re, sqlite3
from pathlib import Path

csv.field_size_limit(1024 * 1024 * 128)

BOOL_COLUMNS = {"is_active", "is_available", "is_promo", "is_featured", "is_popular"}
INTEGER_COLUMNS = {"sort_order", "item_sold", "quantity", "priority", "display_order", "sync_interval_hours"}
REAL_COLUMNS = {"price", "promo_price", "original_price", "discount_percent", "commission_rate", "item_rating", "subtotal", "estimated_total", "base_price", "discount_amount", "discount_percentage", "extracted_price", "confidence"}

def quote(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'

def sqlite_type(column: str) -> str:
    if column in BOOL_COLUMNS or column in INTEGER_COLUMNS: return "INTEGER"
    if column in REAL_COLUMNS: return "REAL"
    return "TEXT"

def normalise(value: str | None, column: str):
    if value is None or value == "": return None
    if column not in {"description", "raw_data", "items", "value", "images"}: value = value.strip()
    if column in BOOL_COLUMNS: return 1 if value.lower() in {"true", "t", "1", "yes"} else 0
    if column in INTEGER_COLUMNS:
        try: return int(float(value))
        except ValueError: return None
    if column in REAL_COLUMNS:
        try: return float(value)
        except ValueError: return None
    return value

def import_table(connection: sqlite3.Connection, csv_path: Path) -> int:
    table = csv_path.stem.removesuffix("_rows")
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle); columns = next(reader, [])
        if not columns: return 0
        primary_key = "id" if "id" in columns else ("key" if "key" in columns else None)
        definitions = [f"{quote(column)} {sqlite_type(column)}" for column in columns]
        if primary_key: definitions[columns.index(primary_key)] += " PRIMARY KEY"
        connection.execute(f"DROP TABLE IF EXISTS {quote(table)}")
        connection.execute(f"CREATE TABLE {quote(table)} ({', '.join(definitions)})")
        placeholders = ", ".join("?" for _ in columns)
        statement = f"INSERT OR REPLACE INTO {quote(table)} ({', '.join(quote(column) for column in columns)}) VALUES ({placeholders})"
        count, batch = 0, []
        for row in reader:
            row += [""] * (len(columns) - len(row))
            batch.append(tuple(normalise(row[i], column) for i, column in enumerate(columns)))
            if len(batch) >= 2000:
                connection.executemany(statement, batch); count += len(batch); batch.clear()
        if batch: connection.executemany(statement, batch); count += len(batch)
    return count

def create_indexes_and_view(connection: sqlite3.Connection) -> None:
    for table, columns in {"products": ("name", "slug", "category_id", "brand", "price", "created_at"), "affiliate_products": ("name", "slug", "category", "merchant", "price", "is_active")}.items():
        existing = {row[1] for row in connection.execute(f"PRAGMA table_info({quote(table)})")}
        for column in columns:
            if column in existing:
                name = re.sub(r"[^a-zA-Z0-9_]", "_", f"idx_{table}_{column}")
                connection.execute(f"CREATE INDEX IF NOT EXISTS {quote(name)} ON {quote(table)} ({quote(column)})")
    connection.execute("DROP VIEW IF EXISTS all_products")
    connection.execute("""CREATE VIEW all_products AS
        SELECT p.id, 'own' AS product_type, p.name, p.slug, p.brand, COALESCE(c.name, '') AS category, p.description,
               COALESCE(p.image_url, '') AS image_url, COALESCE(p.thumbnail_url, '') AS thumbnail_url,
               '' AS product_url, '' AS affiliate_url, p.price, p.promo_price, COALESCE(p.is_promo, 0) AS is_promo,
               COALESCE(p.is_available, 1) AS is_active, COALESCE(p.stock_status, 'in_stock') AS stock_status, 0 AS item_sold, 0.0 AS item_rating, p.created_at
        FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.deleted_at IS NULL OR p.deleted_at = ''
        UNION ALL
        SELECT a.id, 'affiliate', a.name, a.slug, '' AS brand, COALESCE(a.category, ''), a.description,
               COALESCE(a.image_url, ''), COALESCE(a.image_url, ''), a.product_url, a.affiliate_url, a.price, a.original_price,
               CASE WHEN COALESCE(a.original_price, 0) > COALESCE(a.price, 0) THEN 1 ELSE 0 END AS is_promo, COALESCE(a.is_active, 1) AS is_active,
               'in_stock' AS stock_status, COALESCE(a.item_sold, 0) AS item_sold, COALESCE(a.item_rating, 0) AS item_rating, a.created_at
        FROM affiliate_products a WHERE a.is_active = 1""")

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("tools/supabase"))
    parser.add_argument("--database", type=Path, default=Path("backend/katalog_local.db"))
    args = parser.parse_args(); source, database = args.source.resolve(), args.database.resolve()
    files = sorted(source.glob("*_rows.csv"))
    if not files: raise SystemExit(f"Tidak ada CSV *_rows.csv di {source}")
    database.parent.mkdir(parents=True, exist_ok=True)
    for suffix in ("", "-wal", "-shm"):
        target = Path(str(database) + suffix)
        if target.exists(): target.unlink()
    connection = sqlite3.connect(database)
    try:
        connection.execute("PRAGMA journal_mode = WAL"); connection.execute("PRAGMA synchronous = NORMAL"); connection.execute("PRAGMA foreign_keys = OFF")
        counts = {}
        for csv_path in files:
            counts[csv_path.stem.removesuffix("_rows")] = import_table(connection, csv_path); connection.commit()
        create_indexes_and_view(connection); connection.execute("ANALYZE"); connection.commit()
    finally: connection.close()
    print(f"Database: {database}")
    for table, count in counts.items(): print(f"{table}: {count:,} rows")

if __name__ == "__main__": main()
