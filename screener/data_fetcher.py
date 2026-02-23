import requests

def nse_stock_list_fetcher(index: str) -> list[str]:

    index = index.upper()
    index = index.replace("-", "%20")
    
    session = requests.Session()

    url = f"https://www.nseindia.com/api/equity-stockIndices?index={index}"
    
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.nseindia.com",
    }
    
    response = session.get(url, headers=headers)
    data = response.json()

    # Filter only stocks (exclude the index entry which has no 'series' key)
    stocks = [item for item in data["data"] if "series" in item]

    stock_symbols = []

    for stock in stocks:
        print(stock["symbol"])
        stock_symbols.append(stock["symbol"])

    return stock_symbols
