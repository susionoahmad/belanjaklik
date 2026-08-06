from excel_exporter import export_to_excel

rows = []
def add(source, names, brand, variant, size, price, original):
    for name in names:
        rows.append({
            'product_name': name, 'brand': brand, 'variant': variant, 'package_size': size,
            'price': price, 'original_price': original,
            'discount_percentage': round((original - price) / original * 100),
            'stock_status': 'Tersedia', 'category': 'Promo Merchant', 'promo_type': 'GANTUNG',
            'promo_badge': 'PROMO GANTUNG', 'promo_title': 'Promo Gantung Alfamart',
            'promo_start_date': '2026-07-28', 'promo_end_date': '2026-08-03',
            'image': '', '_source_index': source
        })

add(1, ['PROMINA Puff Pisang 15g', 'PROMINA Blueberry 15g', 'PROMINA Str Apple 15g', 'PROMINA Wagyu Beef 15g'], 'Promina', 'Puff', '15g', 14800, 18400)
add(2, ['CIMORY UHT No Sugar TP 225ml All Var'], 'Cimory', 'UHT No Sugar TP All Var', '225ml', 6400, 7400)
add(3, ['ULTRA MILK UHT Cokelat 250ml', 'ULTRA MILK UHT Stroberi 250ml', 'ULTRA MILK UHT Moka 250ml'], 'Ultra Milk', 'UHT', '250ml', 15300, 16800)
add(4, ['ULTRA MILK UHT Low Fat Cokelat 1L'], 'Ultra Milk', 'UHT Low Fat Cokelat', '1L', 16500, 18000)
add(5, ['ULTRA MILK UHT Cokelat 1L'], 'Ultra Milk', 'UHT Cokelat', '1L', 39400, 45400)
add(6, ['ULTRA MILK UHT Low Fat Cokelat 1L'], 'Ultra Milk', 'UHT Low Fat Cokelat', '1L', 45400, 51400)
add(7, ['DIAMOND UHT Full Cream 200ml', 'DIAMOND Mallow 200ml', 'DIAMOND Bubble Gum 200ml'], 'Diamond', 'UHT', '200ml', 5500, 5900)
add(8, ['DIAMOND UHT Full Cream 1L'], 'Diamond', 'UHT Full Cream', '1L', 22000, 22500)
add(9, ['BONEETO Chocolate Box 320g'], 'Boneeto', 'Chocolate Box', '320g', 36600, 46200)
add(10, ['BONEETO Chocolate Box 685g'], 'Boneeto', 'Chocolate Box', '685g', 70000, 82500)
add(11, ['VIDORAN Xmart 1+ Madu 700g', 'VIDORAN Xmart 1+ Vanila 700g'], 'Vidoran', 'Xmart 1+', '700g', 55900, 58900)
add(12, ['VIDORAN Xmart 3+ Madu 700g', 'VIDORAN Xmart 3+ Vanila 700g'], 'Vidoran', 'Xmart 3+', '700g', 51200, 53900)

for item in rows:
    item.pop('_source_index', None)
export_to_excel(rows, 'D:/PROJECT/alfamind/ocr/hasil_gantung10.xlsx')
