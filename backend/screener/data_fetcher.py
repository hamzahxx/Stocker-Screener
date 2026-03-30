import requests
import yfinance as yf
import pandas as pd
from screener.cache import cache_get, cache_set

def get_stock_data(ticker: str, period: str = "2y", interval: str = "1d"):
    ticker = ticker.upper()
    ns_ticker = ticker + ".NS"

    print(f"[get_stock_data] Fetching data for: {ns_ticker}")
    try:
        stock = yf.Ticker(ns_ticker)
        print(f"[get_stock_data] yf.Ticker created for {ns_ticker}")
    except Exception as e:
        print(f"[get_stock_data] ERROR creating yf.Ticker for {ns_ticker}: {e}")
        raise

    try:
        info = stock.info
        print(f"[get_stock_data] stock.info fetched OK — keys: {list(info.keys())[:5]}")
    except Exception as e:
        print(f"[get_stock_data] ERROR fetching stock.info for {ns_ticker}: {e}")
        raise

    try:
        history = stock.history(period=period, interval=interval, auto_adjust=False)
        print(f"[get_stock_data] stock.history fetched OK — rows: {len(history)}, columns: {list(history.columns)}")
        if history.empty:
            print(f"[get_stock_data] WARNING: history DataFrame is EMPTY for {ns_ticker}")

        if interval == "1d" and not history.empty and "Close" in history.columns:
            last_close = history["Close"].iloc[-1]
            if pd.isna(last_close):
                live_price = (
                    info.get("regularMarketPrice")
                    or info.get("currentPrice")
                    or stock.fast_info.get("lastPrice")
                )
                if live_price is not None:
                    history.at[history.index[-1], "Close"] = float(live_price)
                    print(
                        "[get_stock_data] Patched latest NaN Close with live price "
                        f"{float(live_price):.2f} for {ns_ticker}"
                    )
                else:
                    print(f"[get_stock_data] WARNING: Latest Close is NaN and no live price was available for {ns_ticker}")
    except Exception as e:
        print(f"[get_stock_data] ERROR fetching stock.history for {ns_ticker}: {e}")
        raise
    
    return {
        "info": info,
        "history": history
    }

def nse_stock_list_fetcher(index: str) -> list[str]:
    print(f"[nse_stock_list_fetcher] Fetching stock list for index: {index}")

    index = index.upper()

    cache_key = f"index:{index}"

    cached = cache_get(cache_key)
    if cached is not None:
        print(f"[nse_stock_list_fetcher] CACHED -> {index}")
        return cached

    index = index.replace("-", "%20")

    session = requests.Session()
    url = f"https://www.nseindia.com/api/equity-stockIndices?index={index}"

    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.nseindia.com",
    }

    try:
        response = session.get(url, headers=headers)
        print(f"[nse_stock_list_fetcher] NSE API response status: {response.status_code}")
        response.raise_for_status()
    except Exception as e:
        print(f"[nse_stock_list_fetcher] ERROR calling NSE API: {e}")
        raise

    try:
        data = response.json()
        print(f"[nse_stock_list_fetcher] JSON parsed OK — top-level keys: {list(data.keys())}")
    except Exception as e:
        print(f"[nse_stock_list_fetcher] ERROR parsing JSON response: {e}")
        raise

    stocks = [item for item in data["data"] if "series" in item]
    stock_symbols = [stock["symbol"] for stock in stocks]
    print(f"[nse_stock_list_fetcher] Found {len(stock_symbols)} stocks in {index}")

    cache_set(cache_key, stock_symbols)
    return stock_symbols
