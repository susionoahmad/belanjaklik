import re

def extract_valid_prices_from_line(line: str) -> list[int]:
    """
    Strips package sizes (200ml, 250ml, 10x25g, 2026 year), discount text (Potongan Rp 1.800),
    and returns valid retail prices between Rp 1.000 and Rp 500.000.
    """
    # 1. Ignore discount amount lines
    if re.search(r"\b(?:potongan|hemat|cashback|diskon)\b", line, re.IGNORECASE):
        return []

    # 2. Strip package volume/weight numbers (e.g. 200ml -> '', 250ml -> '', 10x25g -> '', 2026 -> '')
    line_clean = re.sub(r"\b\d+\s*(?:ml|g|gr|gram|kg|l|pcs|pack|sachet|x\d+g)\b", "", line, flags=re.IGNORECASE)
    line_clean = re.sub(r"\b202\d\b", "", line_clean) # strip year e.g. 2026
    line_clean = re.sub(r"\b\d+X\d+\w*\b", "", line_clean, flags=re.IGNORECASE)

    # 3. Extract prices
    prices_found = re.findall(r"(?:Rp\.?|RP)?\s*(\d{1,3}(?:[\.,]\d{3})+|\d{4,6})", line_clean, re.IGNORECASE)
    valid = []
    for p_str in prices_found:
        digits_only = re.sub(r"[^\d]", "", p_str)
        if digits_only:
            val = int(digits_only)
            # Valid FMCG price range in Rupiah
            if 1000 <= val <= 500000:
                valid.append(val)
    return valid

def test_price_filter():
    sample_lines = [
        "Air PET 6OOml Lmun Varawva Aola 3.200 2.500",
        "NESTLE PURE LIFE Air Mineral PET 6OOml 2026 2.500",
        "Potongan Rp 1.800 9.900",
        "GOOD DAY Cappuccino 10X25g 25.200 22.900",
        "GOOD DAY PET 25Oml All Var 7.700 6.700"
    ]

    for line in sample_lines:
        prices = extract_valid_prices_from_line(line)
        print(f"Line: '{line}' => Prices: {prices}")

if __name__ == "__main__":
    test_price_filter()
