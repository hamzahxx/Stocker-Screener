import pandas as pd

def check_uptrend(df: pd.DataFrame) -> dict:
    # Price above 200 SMA = uptrend
    sma200 = df["Close"].rolling(200).mean().iloc[-1]
    current_price = df["Close"].iloc[-1]
    in_uptrend = bool(current_price > sma200)
    return {"score": 15 if in_uptrend else 0, "details": {"uptrend": in_uptrend}}


def check_support_resistance(df: pd.DataFrame) -> dict:
    # Simplified: find local min/max that price bounced from 2+ times
    # Use rolling windows to find swing highs/lows
    highs = df["High"].rolling(5, center=True).max()
    lows = df["Low"].rolling(5, center=True).min()
    
    resistance_levels = df["High"][df["High"] == highs].value_counts()
    support_levels = df["Low"][df["Low"] == lows].value_counts()
    
    strong_support = resistance_levels[resistance_levels >= 2]
    strong_resistance = support_levels[support_levels >= 2]
    
    score = 10 if (len(strong_support) > 0 and len(strong_resistance) > 0) else 0
    return {"score": score, "details": {"support_count": int(len(strong_support)), "resistance_count": int(len(strong_resistance))}}


def check_near_support(df: pd.DataFrame) -> dict:
    current = df["Close"].iloc[-1]
    recent_low = df["Low"].tail(20).min()
    near = bool(abs(current - recent_low) / current < 0.03)  # within 3%
    return {"score": 10 if near else 0, "details": {"near_support": near}}


def check_bullish_intent(df: pd.DataFrame) -> dict:
    last = df.iloc[-1]
    prev = df.iloc[-2]
    body = last["Close"] - last["Open"]
    prev_body = prev["Open"] - prev["Close"]  # previous bearish candle

    big_green = bool(body > 0 and body > (last["High"] - last["Low"]) * 0.6)
    engulfing = bool((last["Close"] > prev["Open"]) and (last["Open"] < prev["Close"]) and prev_body > 0)

    score = 10 if (big_green or engulfing) else 0
    return {"score": score, "details": {"big_green": big_green, "engulfing": engulfing}}


def check_sma_signal(df: pd.DataFrame) -> dict:
    close = df["Close"]
    sma20 = close.rolling(20).mean().iloc[-1]
    sma50 = close.rolling(50).mean().iloc[-1]
    price = close.iloc[-1]

    if price > sma20 > sma50:
        signal, score = "BUY", 10
    elif price < sma20 < sma50:
        signal, score = "SELL", 0
    else:
        signal, score = "NEUTRAL", 5

    return {"score": score, "details": {"sma_signal": signal}}


def check_ema_signal(df: pd.DataFrame) -> dict:
    close = df["Close"]
    ema9 = close.ewm(span=9).mean().iloc[-1]
    ema21 = close.ewm(span=21).mean().iloc[-1]
    ema55 = close.ewm(span=55).mean().iloc[-1]

    if ema9 > ema21 > ema55:
        signal, score = "BUY", 10
    elif ema9 < ema21 < ema55:
        signal, score = "SELL", 0
    else:
        signal, score = "NEUTRAL", 5

    return {"score": score, "details": {"ema_signal": signal}}


def check_fibonacci(df: pd.DataFrame) -> dict:
    high = df["High"].tail(60).max()
    low = df["Low"].tail(60).min()
    current = df["Close"].iloc[-1]

    retrace = (high - current) / (high - low)

    if 0.382 <= retrace <= 0.618:
        label, score = "HEALTHY_UPTREND", 15
    elif retrace < 0.382:
        label, score = "FAST_UPTREND", 5
    else:
        label, score = "NEUTRAL_UPTREND", 10

    return {"score": score, "details": {"fib_retrace_pct": float(round(retrace * 100, 2)), "label": label}}