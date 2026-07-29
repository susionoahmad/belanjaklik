from excel_exporter import export_to_excel

rows = []
def add(image, source, names, brand, variant, size, price, original):
    for name in names:
        rows.append({
            'product_name': name, 'brand': brand, 'variant': variant, 'package_size': size,
            'price': price, 'original_price': original,
            'discount_percentage': round((original - price) / original * 100),
            'stock_status': 'Tersedia', 'category': 'Promo Merchant', 'promo_type': 'GANTUNG',
            'promo_badge': 'PROMO GANTUNG', 'promo_title': 'Promo Gantung Alfamart',
            'promo_start_date': '2026-07-28', 'promo_end_date': '2026-08-03', 'image': '',
            '_image': image, '_source': source
        })

add('Gantung13.jpeg', 1, ['SOKLIN Liq Det Violet 1600ml', 'SOKLIN Blossom 1600ml', 'SOKLIN Softgent Ref 1600ml'], 'Soklin', 'Liq Det', '1600ml', 31500, 34800)
add('Gantung13.jpeg', 2, ['SOKLIN Softgergent Pink 700/720g', 'SOKLIN Purp 700/720g', 'SOKLIN Magnolia Ref 700/720g'], 'Soklin', 'Softgergent', '700/720g', 16500, 17300)
add('Gantung13.jpeg', 3, ['DAIA Detergent 1,4/1,5kg All Var'], 'Daia', 'Detergent All Var', '1,4/1,5kg', 26300, 29200)
add('Gantung13.jpeg', 4, ['DOWNY Floral Pink 500ml', 'DOWNY Milky Touch Ref 500ml'], 'Downy', 'Floral Pink / Milky Touch Ref', '500ml', 19900, 26500)
add('Gantung13.jpeg', 5, ['DOWNY Sunrise Ref 500ml', 'DOWNY Mystique 500ml', 'DOWNY Passion Ref 500ml'], 'Downy', 'Sunrise Ref / Mystique / Passion Ref', '500ml', 20900, 26500)
add('Gantung13.jpeg', 6, ['DOWNY 3in1 Sunrise 500ml', 'DOWNY Midnight 500ml'], 'Downy', '3in1', '500ml', 23900, 31000)
add('Gantung13.jpeg', 7, ['DOWNY Sunr Fresh 875ml', 'DOWNY Mystique Ref 875ml'], 'Downy', 'Sunr Fresh / Mystique Ref', '875ml', 29900, 41000)
add('Gantung13.jpeg', 8, ['VANISH Cair 425ml', 'VANISH Matic Cair Ref 425ml'], 'Vanish', 'Cair / Matic Cair Ref', '425ml', 19900, 29900)
add('Gantung13.jpeg', 9, ['HARPIC Power Triple Action 450ml', 'HARPIC Plus Citrus 450ml'], 'Harpic', 'Power Triple Action / Plus Citrus', '450ml', 19900, 30500)
add('Gantung13.jpeg', 10, ['MAMA Lemon 690g', 'MAMA Lime 690g', 'MAMA Green Ref 690g'], 'Mama', 'Lemon / Lime / Green Ref All Var', '690g', 8900, 10600)
add('Gantung13.jpeg', 11, ['MAMA Lemon Jeruk Nipis 950g', 'MAMA Lime Charcoal 950g'], 'Mama', 'Lemon Jeruk Nipis / Lime Charcoal', '950g', 12500, 14200)
add('Gantung13.jpeg', 12, ['SOKLIN Pembersih Lantai 770/780ml All Var'], 'Soklin', 'Pembersih Lantai All Var', '770/780ml', 10500, 13400)
add('Gantung13.jpeg', 13, ['SUPER SOL Kembang 720g/750ml', 'SUPER SOL Pine 720g/750ml', 'SUPER SOL Sereh 720g/750ml', 'SUPER SOL Floral 720g/750ml'], 'Super Sol', 'Kembang / Pine / Sereh / Floral', '720g/750ml', 10500, 13800)
add('Gantung13.jpeg', 14, ['BAYGON Aero Citrus Fresh 400ml', 'BAYGON Lavender 400ml'], 'Baygon', 'Aero Citrus Fresh / Lavender', '400ml', 25900, 28900)
add('Gantung13.jpeg', 15, ['BAYGON Aero Flower Garden 600ml', 'BAYGON Citrus Fresh 600ml'], 'Baygon', 'Aero Flower Garden / Citrus Fresh', '600ml', 34900, 45900)
add('Gantung13.jpeg', 16, ['VAPE Aerosol 600ml All Var'], 'Vape', 'Aerosol All Var', '600ml', 33900, 38500)

add('Gantung14.jpeg', 1, ['ANTANGIN JRG 5X15ml'], 'Antangin', 'JRG', '5X15ml', 16900, 23200)
add('Gantung14.jpeg', 2, ['ANTANGIN Habatusauda Box 5X15ml'], 'Antangin', 'Habatusauda Box', '5X15ml', 16500, 23900)
add('Gantung14.jpeg', 3, ['TRESNO JOYO Madu Murni 150g'], 'Tresno Joyo', 'Madu Murni', '150g', 23100, 28300)
add('Gantung14.jpeg', 4, ['LANG Minyak Kayu Putih Plus 60ml'], 'Lang', 'Minyak Kayu Putih Plus', '60ml', 22500, 30500)
add('Gantung14.jpeg', 5, ['LANG Minyak Kayu Putih Plus 120ml'], 'Lang', 'Minyak Kayu Putih Plus', '120ml', 42000, 65400)
add('Gantung14.jpeg', 6, ['LANG Minyak Kayu Putih 60ml'], 'Lang', 'Minyak Kayu Putih', '60ml', 22500, 28700)
add('Gantung14.jpeg', 7, ['LANG Minyak Kayu Putih 120ml'], 'Lang', 'Minyak Kayu Putih', '120ml', 42000, 56600)
add('Gantung14.jpeg', 8, ['MY BABY Minyak Telon Plus 60ml'], 'My Baby', 'Minyak Telon Plus', '60ml', 15500, 18200)
add('Gantung14.jpeg', 9, ['MY BABY Minyak Telon Plus 90ml'], 'My Baby', 'Minyak Telon Plus', '90ml', 23500, 24600)
add('Gantung14.jpeg', 10, ['MY BABY Minyak Telon Plus 120ml'], 'My Baby', 'Minyak Telon Plus', '120ml', 32500, 38600)
add('Gantung14.jpeg', 11, ['FRESH CARE Lavender 10ml'], 'Fresh Care', 'Lavender', '10ml', 10900, 16500)
add('Gantung14.jpeg', 12, ['FRESH CARE Minyak Angin S Fruity 10ml'], 'Fresh Care', 'Minyak Angin S Fruity', '10ml', 10900, 16700)
add('Gantung14.jpeg', 13, ['GPU Minyak Urut Sereh 60ml'], 'GPU', 'Minyak Urut Sereh', '60ml', 17900, 25000)
add('Gantung14.jpeg', 14, ['HOT IN CREAM Tube 60g'], 'Hot In Cream', 'Tube', '60g', 22900, 26900)

for item in rows:
    item.pop('_image', None)
    item.pop('_source', None)
export_to_excel(rows, 'D:/PROJECT/alfamind/ocr/hasil_gantung13_14.xlsx')
