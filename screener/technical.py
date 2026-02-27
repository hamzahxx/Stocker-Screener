import pandas as pd
import numpy as np

def check_uptrend(df: pd.DataFrame) -> dict:
    print(f"[check_uptrend] df rows: {len(df)}")
    # Price above 200 SMA = uptrend
    sma200 = df["Close"].rolling(200).mean().iloc[-1]
    current_price = df["Close"].iloc[-1]
    in_uptrend = bool(current_price > sma200)
    print(f"[check_uptrend] price={current_price:.2f}, sma200={sma200:.2f}, in_uptrend={in_uptrend}")
    return {"score": 15 if in_uptrend else 0, "details": {"uptrend": in_uptrend}}


def check_support_resistance(df: pd.DataFrame) -> dict:
    print(f"[check_support_resistance] df rows: {len(df)}")

    window = 5
    highs = df["High"].values
    lows = df["Low"].values

    swing_highs = []
    swing_lows = []

    for i in range(window, len(df) - window):
        if highs[i] == max(highs[i - window:i + window + 1]):
            swing_highs.append(highs[i])
        if lows[i] == min(lows[i - window:i + window + 1]):
            swing_lows.append(lows[i])

    current_price = float(df["Close"].iloc[-1])


    def strong_levels(raw_levels: list, tolerance_pct: float = 0.015) -> list:
        if not raw_levels:
            return []
        raw_levels = sorted(raw_levels)
        clusters = []
        group = [raw_levels[0]]
        for level in raw_levels[1:]:
            if (level - group[0]) / group[0] <= tolerance_pct:
                group.append(level)
            else:
                if len(group) >= 2:  # 2+ touches = real level
                    clusters.append(round(float(np.mean(group)), 2))
                group = [level]
        if len(group) >= 2:
            clusters.append(round(float(np.mean(group)), 2))
        return clusters

    support_levels = strong_levels(swing_lows)
    resistance_levels = strong_levels(swing_highs)

    supports_below = [s for s in support_levels if s < current_price]
    resistance_above = [r for r in resistance_levels if r > current_price]

    nearest_support = max(supports_below) if supports_below else None
    nearest_resistance = min(resistance_above) if resistance_above else None

    has_both = nearest_support is not None and nearest_resistance is not None

    if has_both:
        pct_from_support = (current_price - nearest_support) / current_price
        if pct_from_support <= 0.03:
            score = 10   # Near support with clear resistance above
        elif pct_from_support <= 0.07:
            score = 7    # Reasonable distance from support
        else:
            score = 4    # Levels exist but price is mid-range
    elif nearest_support is not None:
        score = 3        # Only support found
    elif nearest_resistance is not None:
        score = 2        # Only resistance found
    else:
        score = 0        # No clear levels

    print(f"[check_support_resistance] support={nearest_support}, resistance={nearest_resistance}, "
          f"price={current_price:.2f}, score={score}")

    return {
        "score": score,
        "details": {
            "support_count": len(support_levels),
            "resistance_count": len(resistance_levels),
            "nearest_support": nearest_support,
            "nearest_resistance": nearest_resistance,
            "has_both": has_both,
        }
    }


def check_near_support(df: pd.DataFrame) -> dict:
    print(f"[check_near_support] df rows: {len(df)}")
    current = df["Close"].iloc[-1]
    recent_low = df["Low"].tail(20).min()
    near = bool(abs(current - recent_low) / current < 0.03)  # within 3%
    print(f"[check_near_support] current={current:.2f}, recent_low={recent_low:.2f}, near={near}")
    return {"score": 10 if near else 0, "details": {"near_support": near}}


def check_bullish_intent(df: pd.DataFrame) -> dict:
    print(f"[check_bullish_intent] df rows: {len(df)}")
    last = df.iloc[-1]
    prev = df.iloc[-2]
    body = last["Close"] - last["Open"]
    prev_body = prev["Open"] - prev["Close"]  # previous bearish candle

    big_green = bool(body > 0 and body > (last["High"] - last["Low"]) * 0.6)
    engulfing = bool((last["Close"] > prev["Open"]) and (last["Open"] < prev["Close"]) and prev_body > 0)

    score = 10 if (big_green or engulfing) else 0
    print(f"[check_bullish_intent] big_green={big_green}, engulfing={engulfing}, score={score}")
    return {"score": score, "details": {"big_green": big_green, "engulfing": engulfing}}


def check_sma_signal(df: pd.DataFrame) -> dict:
    print(f"[check_sma_signal] df rows: {len(df)}")
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

    print(f"[check_sma_signal] price={price:.2f}, sma20={sma20:.2f}, sma50={sma50:.2f}, signal={signal}")
    return {"score": score, "details": {"sma_signal": signal}}


def check_ema_signal(df: pd.DataFrame) -> dict:
    print(f"[check_ema_signal] df rows: {len(df)}")
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

    print(f"[check_ema_signal] ema9={ema9:.2f}, ema21={ema21:.2f}, ema55={ema55:.2f}, signal={signal}")
    return {"score": score, "details": {"ema_signal": signal}}


def check_fibonacci(df: pd.DataFrame) -> dict:
    print(f"[check_fibonacci] df rows: {len(df)}")
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

    print(f"[check_fibonacci] high={high:.2f}, low={low:.2f}, current={current:.2f}, retrace={retrace:.2%}, label={label}")
    return {"score": score, "details": {"fib_retrace_pct": float(round(retrace * 100, 2)), "label": label}}


def check_rsi(df: pd.DataFrame) -> dict:
    print(f"[check_rsi] df rows: {len(df)}")
    close = df["Close"]
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = -delta.clip(upper=0).rolling(14).mean()
    rs = gain / loss
    rsi = float((100 - (100 / (1 + rs))).iloc[-1])

    # Swing trading RSI logic:
    # 40-60 = healthy momentum (best swing entry zone)
    # <30   = oversold, potential reversal (good but risky)
    # >70   = overbought, avoid entry
    if 40 <= rsi <= 60:
        score, label = 15, "HEALTHY"
    elif rsi < 30:
        score, label = 10, "OVERSOLD"
    elif 30 <= rsi < 40:
        score, label = 8, "RECOVERING"
    elif 60 < rsi <= 70:
        score, label = 5, "EXTENDED"
    else:
        score, label = 0, "OVERBOUGHT"

    print(f"[check_rsi] rsi={rsi:.2f}, label={label}, score={score}")
    return {"score": score, "details": {"rsi": round(rsi, 2), "rsi_label": label}}


def check_macd(df: pd.DataFrame) -> dict:
    print(f"[check_macd] df rows: {len(df)}")
    close = df["Close"]
    ema12 = close.ewm(span=12).mean()
    ema26 = close.ewm(span=26).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9).mean()
    histogram = macd_line - signal_line

    macd_val = float(macd_line.iloc[-1])
    signal_val = float(signal_line.iloc[-1])
    hist_val = float(histogram.iloc[-1])
    prev_hist = float(histogram.iloc[-2])

    # Swing trading MACD logic:
    # Fresh bullish crossover = best entry signal
    # MACD above signal + histogram growing = strong momentum
    # MACD below signal = avoid
    fresh_crossover = bool(hist_val > 0 and prev_hist <= 0)  # just crossed up
    bullish = bool(macd_val > signal_val)
    histogram_growing = bool(hist_val > prev_hist)

    if fresh_crossover:
        score, label = 15, "FRESH_CROSSOVER"
    elif bullish and histogram_growing:
        score, label = 10, "BULLISH_MOMENTUM"
    elif bullish:
        score, label = 5, "BULLISH_WEAKENING"
    else:
        score, label = 0, "BEARISH"

    print(f"[check_macd] macd={macd_val:.4f}, signal={signal_val:.4f}, hist={hist_val:.4f}, label={label}")
    return {"score": score, "details": {"macd": round(macd_val, 4), "signal": round(signal_val, 4), "histogram": round(hist_val, 4), "macd_label": label}}


def volume_confirmation(df: pd.DataFrame) -> dict:
    print(f"[check_volume] df rows: {len(df)}")
    volume = df["Volume"]
    avg_volume = float(volume.tail(20).mean())
    last_volume = float(volume.iloc[-1])
    last_close = float(df["Close"].iloc[-1])
    prev_close = float(df["Close"].iloc[-2])

    volume_ratio = last_volume / avg_volume if avg_volume > 0 else 1.0
    price_up = last_close > prev_close

    # Swing trading volume logic:
    # Price up + high volume = strong conviction (best)
    # Price up + low volume = weak move, caution
    # Price down + high volume = distribution, bad
    if price_up and volume_ratio >= 1.5:
        score, label = 15, "HIGH_VOLUME_BREAKOUT"
    elif price_up and volume_ratio >= 1.0:
        score, label = 10, "NORMAL_VOLUME_UP"
    elif price_up and volume_ratio < 1.0:
        score, label = 5, "LOW_VOLUME_UP"
    else:
        score, label = 0, "SELLING_PRESSURE"

    print(f"[check_volume] last_vol={last_volume:.0f}, avg_vol={avg_volume:.0f}, ratio={volume_ratio:.2f}, label={label}")
    return {"score": score, "details": {"volume_ratio": round(volume_ratio, 2), "volume_label": label}}


def check_adx(df: pd.DataFrame) -> dict:
    print(f"[check_adx] df rows: {len(df)}")
    high = df["High"]
    low = df["Low"]
    close = df["Close"]
    period = 14

    # True Range
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

    # Directional Movement
    up_move = high.diff()
    down_move = -low.diff()
    plus_dm = up_move.where((up_move > down_move) & (up_move > 0), 0.0)
    minus_dm = down_move.where((down_move > up_move) & (down_move > 0), 0.0)

    atr = tr.ewm(span=period).mean()
    plus_di = 100 * (plus_dm.ewm(span=period).mean() / atr)
    minus_di = 100 * (minus_dm.ewm(span=period).mean() / atr)
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di)
    adx = float(dx.ewm(span=period).mean().iloc[-1])
    plus_di_val = float(plus_di.iloc[-1])
    minus_di_val = float(minus_di.iloc[-1])

    # Swing trading ADX logic:
    # ADX > 25 + +DI > -DI = strong uptrend, swing setups are reliable
    # ADX < 20 = ranging market, swing setups often fail
    trending_up = bool(plus_di_val > minus_di_val)

    if adx >= 25 and trending_up:
        score, label = 15, "STRONG_UPTREND"
    elif adx >= 25 and not trending_up:
        score, label = 0, "STRONG_DOWNTREND"
    elif 20 <= adx < 25 and trending_up:
        score, label = 8, "DEVELOPING_TREND"
    else:
        score, label = 3, "RANGING"

    print(f"[check_adx] adx={adx:.2f}, +DI={plus_di_val:.2f}, -DI={minus_di_val:.2f}, label={label}")
    return {"score": score, "details": {"adx": round(adx, 2), "plus_di": round(plus_di_val, 2), "minus_di": round(minus_di_val, 2), "adx_label": label}}

