from excel_exporter import export_to_excel

products = [
    ['SERASOFT Shp Hair Fall 340ml', 'Serasoft', 'Shp Hair Fall', '340ml', 34900, 46900],
    ['LOREAL Shp Glycolic Gloss, Fall Resist, Hyaluron Pure 200ml, Cond Glycolic Gloss, Fall Resist 175ml', 'L’Oreal', 'Shp Glycolic Gloss, Fall Resist, Hyaluron Pure 200ml, Cond Glycolic Gloss, Fall Resist', '200ml + 175ml', 29900, 34900],
    ['ELLIPS Hair Vit 6s All Var', 'Ellips', 'Hair Vitamin All Var', '6s', 11000, 16200],
    ['ELLIPS Vit Hair Mist Me Up 50ml', 'Ellips', 'Vit Hair Mist Me Up', '50ml', 14900, 17900],
    ['NIVEA Women RO Hijab Soft 50ml', 'Nivea', 'Women RO Hijab Soft', '50ml', 17900, 28200],
    ['NIVEA Women RO Extra White, Pearl&Beauty 50ml', 'Nivea', 'Women RO Extra White, Pearl&Beauty', '50ml', 17900, 27900],
    ['NIVEA Men RO 50ml All Var', 'Nivea', 'Men RO All Var', '50ml', 16900, 25200],
    ['BIORE UV Instant Covr SPF50 30g', 'Biore', 'UV Instant Covr SPF50', '30g', 24900, 39900],
    ['BIORE Mens FF Cool Oil, White/Bright, Bright Oil 100g, FW Bright Expr, Acne brg Cr 100ml', 'Biore', 'Mens FF Cool Oil, White/Bright, Bright Oil 100g, FW Bright Expr, Acne brg Cr', '100g + 100ml', 31000, 41000],
    ['VASELINE B Serum Soft Glw 180ml', 'Vaseline', 'B Serum Soft Glw', '180ml', 24900, 39500],
    ['VASELINE B Serum Gluta Flaw, Dewy 180ml', 'Vaseline', 'B Serum Gluta Flaw, Dewy', '180ml', 34900, 48900],
    ['VASELINE B Serum Ovnrnt, Glt Sm 200ml', 'Vaseline', 'B Serum Ovnrnt, Glt Sm', '200ml', 44900, 69900],
]

data = []
for name, brand, variant, size, price, original in products:
    data.append({
        'product_name': name, 'brand': brand, 'variant': variant, 'package_size': size,
        'price': price, 'original_price': original,
        'discount_percentage': round((original - price) / original * 100),
        'stock_status': 'Tersedia', 'category': 'Promo Merchant', 'promo_type': 'GANTUNG',
        'promo_badge': 'PROMO GANTUNG', 'promo_title': 'Promo Gantung Alfamart',
        'promo_start_date': '2026-07-28', 'promo_end_date': '2026-08-03', 'image': ''
    })

export_to_excel(data, 'D:/PROJECT/alfamind/ocr/hasil_gantung9.xlsx')
