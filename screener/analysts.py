def check_analyst_ratings(info: dict) -> dict:
    print(f"[check_analyst_ratings] info keys available: {list(info.keys())[:10]}")
    recommend = info.get("recommendationMean", None)  # 1=Strong Buy, 5=Strong Sell
    num_analysts = info.get("numberOfAnalystOpinions", 0)
    print(f"[check_analyst_ratings] recommendationMean={recommend}, numberOfAnalystOpinions={num_analysts}")

    if recommend is None or num_analysts == 0:
        print(f"[check_analyst_ratings] No analyst data available")
        return {"score": 0, "details": {"rating": "N/A", "analysts": 0}}

    # Lower mean = more bullish
    if recommend <= 2.0:
        score = 15
    elif recommend <= 3.0:
        score = 8
    else:
        score = 0

    return {
        "score": score,
        "details": {
            "recommendation_mean": recommend,
            "analyst_count": num_analysts
        }
    }