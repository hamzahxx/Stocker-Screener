from screener.data_fetcher import get_stock_data
from screener import technical, analysts

def score_stock(ticker: str) -> dict:
    data = get_stock_data(ticker)
    info = data["info"]
    df = data["history"]

    results = {}
    total_score = 0

    checks = [
        ("uptrend",           technical.check_uptrend(df)),
        ("support_resistance",technical.check_support_resistance(df)),
        ("near_support",      technical.check_near_support(df)),
        ("bullish_intent",    technical.check_bullish_intent(df)),
        ("sma_signal",        technical.check_sma_signal(df)),
        ("ema_signal",        technical.check_ema_signal(df)),
        ("fibonacci",         technical.check_fibonacci(df)),
        ("analyst_rating",    analysts.check_analyst_ratings(info)),
    ]

    for name, result in checks:
        results[name] = result
        total_score += result["score"]
        print(f"{ticker} - {total_score} - {result}")


    return {
        "name": ticker,
        "total_score": total_score,
        "breakdown": results,
    }
