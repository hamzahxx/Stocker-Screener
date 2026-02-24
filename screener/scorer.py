from screener.data_fetcher import get_stock_data
from screener import technical, analysts

def score_stock(ticker: str) -> dict:
    print(f"[score_stock] Starting scoring for: {ticker}")

    try:
        data = get_stock_data(ticker)
    except Exception as e:
        print(f"[score_stock] ERROR in get_stock_data for {ticker}: {e}")
        raise

    info = data["info"]
    df = data["history"]
    print(f"[score_stock] Data loaded — history rows: {len(df)}, info keys: {len(info)}")

    if df.empty:
        print(f"[score_stock] ERROR: history DataFrame is empty for {ticker}, cannot score")
        raise ValueError(f"Empty history for {ticker}")

    results = {}
    total_score = 0

    check_fns = [
        ("uptrend",            lambda: technical.check_uptrend(df)),
        ("support_resistance", lambda: technical.check_support_resistance(df)),
        ("near_support",       lambda: technical.check_near_support(df)),
        ("bullish_intent",     lambda: technical.check_bullish_intent(df)),
        ("sma_signal",         lambda: technical.check_sma_signal(df)),
        ("ema_signal",         lambda: technical.check_ema_signal(df)),
        ("fibonacci",          lambda: technical.check_fibonacci(df)),
        ("analyst_rating",     lambda: analysts.check_analyst_ratings(info)),
    ]

    for name, fn in check_fns:
        try:
            result = fn()
            print(f"[score_stock] {name}: score={result['score']}, details={result.get('details')}")
            results[name] = result
            total_score += result["score"]
        except Exception as e:
            print(f"[score_stock] ERROR in check '{name}' for {ticker}: {e}")
            results[name] = {"score": 0, "error": str(e)}

    print(f"[score_stock] Final score for {ticker}: {total_score}")
    return {
        "name": ticker,
        "total_score": total_score,
        "breakdown": results,
    }
