def check_analyst_ratings(info: dict) -> dict:
    recommend = info.get("recommendationMean", None)  # 1=Strong Buy, 5=Strong Sell
    num_analysts = info.get("numberOfAnalystOpinions", 0)

    if recommend is None or num_analysts == 0:
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