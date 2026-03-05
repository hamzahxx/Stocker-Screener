"""
Pre-warms Redis cache for priority indexes.

Locally:  python -m scripts.prewarm_cache
Render:   runs automatically on startup via main.py
"""
from screener.cache import PRIORITY_INDEXES
from screener.data_fetcher import nse_stock_list_fetcher, get_stock_data

def prewarm():
    print("=" * 50)
    print("[prewarm] Starting cache pre-warm")
    print(f"[prewarm] Indexes to warm: {PRIORITY_INDEXES}")
    print("=" * 50)

    total_stocks = 0
    failed_stocks = []

    for index in PRIORITY_INDEXES:
        print(f"\n[prewarm] ── Index: {index}")
        try:
            stocks = nse_stock_list_fetcher(index)
            print(f"[prewarm] {len(stocks)} stocks found")
        except Exception as e:
            print(f"[prewarm] ERROR fetching index {index}: {e}")
            continue

        for i, ticker in enumerate(stocks, 1):
            print(f"[prewarm] [{i}/{len(stocks)}] {ticker}")
            try:
                get_stock_data(ticker, force_refresh=True)  # ← always overwrite
                total_stocks += 1
            except Exception as e:
                print(f"[prewarm] ERROR for {ticker}: {e}")
                failed_stocks.append(ticker)

    print("\n" + "=" * 50)
    print(f"[prewarm] Done.")
    print(f"[prewarm] Successfully cached: {total_stocks} stocks")
    if failed_stocks:
        print(f"[prewarm] Failed ({len(failed_stocks)}): {failed_stocks}")
    print("=" * 50)

if __name__ == "__main__":
    prewarm()