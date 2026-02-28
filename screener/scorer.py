from screener.data_fetcher import get_stock_data
from screener.technical import (
    check_uptrend,
    check_support_resistance,
    check_near_support,
    check_bullish_intent,
    check_sma_signal,
    check_fibonacci,
    check_rsi,
    check_macd,
    volume_confirmation,
    check_adx,
    check_52w_high,
)

# Weights must sum to 100
SWING_CHECKS = [
    {"fn": check_rsi,                "weight": 20, "key": "rsi"},
    {"fn": check_macd,               "weight": 20, "key": "macd"},
    {"fn": check_uptrend,            "weight": 15, "key": "uptrend"},
    {"fn": check_adx,                "weight": 15, "key": "adx"},
    {"fn": check_52w_high,           "weight": 10, "key": "52w_high"},
    {"fn": volume_confirmation,      "weight": 10, "key": "volume"},
    {"fn": check_sma_signal,         "weight": 10, "key": "sma"},
    {"fn": check_fibonacci,          "weight":  5, "key": "fibonacci"},
    {"fn": check_support_resistance, "weight":  3, "key": "support_resistance"},
    {"fn": check_near_support,       "weight":  2, "key": "near_support"},
    {"fn": check_bullish_intent,     "weight":  0, "key": "bullish_intent"},  # reserved for future use
]

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
    total_score = 0.0
    total_weight = 0.0

    for check in SWING_CHECKS:
        if check["weight"] == 0:
            # Still run it so details appear in output, but don't count it
            result = check["fn"](df)
            results[check["key"]] = result
            continue

        result = check["fn"](df)
        raw = result["score"]          # e.g. 0–15 depending on function
        max_raw = _get_max_score(check["fn"])

        # Normalize: what % of max did this check achieve?
        pct = (raw / max_raw) if max_raw > 0 else 0

        # Weighted contribution
        weighted = pct * check["weight"]
        total_score += weighted
        total_weight += check["weight"]

        results[check["key"]] = {
            **result,
            "weighted_score": round(weighted, 2),
            "pct_of_max": round(pct * 100, 1),
        }

    final_pct = round((total_score / total_weight) * 100, 1) if total_weight > 0 else 0

    return {
        "ticker": ticker,
        "final_score": final_pct,       # 0–100, easy to read
        "grade": _grade(final_pct),
        "checks": results,
    }


def _get_max_score(fn) -> int:
    """Max possible raw score each function can return."""
    return {
        check_rsi:                15,
        check_macd:               15,
        check_uptrend:            15,
        check_adx:                15,
        volume_confirmation:      15,
        check_52w_high:           15,
        check_sma_signal:         10,
        check_fibonacci:          15,
        check_support_resistance: 10,
        check_near_support:       10,
        check_bullish_intent:     10,
    }.get(fn, 10)


def _grade(score: float) -> str:
    if score >= 80:   return "A"   # Strong swing candidate
    elif score >= 65: return "B"   # Good setup
    elif score >= 50: return "C"   # Borderline
    elif score >= 35: return "D"   # Weak
    else:             return "F"   # Avoid
