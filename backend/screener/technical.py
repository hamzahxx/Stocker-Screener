import pandas as pd
import numpy as np

def check_uptrend(df: pd.DataFrame) -> dict:
    """
    UPTREND CHECK (max score: 15)
    Calculation:
      - Compute 200-period Simple Moving Average of Close price
      - If current Close > SMA200 → stock is in a long-term uptrend → score 15
      - Otherwise → score 0
    Logic: SMA200 is the classic institutional benchmark for trend direction.
    """
    print(f"[check_uptrend] df rows: {len(df)}")
    sma200 = df["Close"].rolling(200).mean().iloc[-1]
    current_price = df["Close"].iloc[-1]
    in_uptrend = bool(current_price > sma200)
    print(f"[check_uptrend] price={current_price:.2f}, sma200={sma200:.2f}, in_uptrend={in_uptrend}")
    return {"score": 15 if in_uptrend else 0, "details": {"uptrend": in_uptrend}}


def check_support_resistance(df: pd.DataFrame) -> dict:
    """
    SUPPORT & RESISTANCE CHECK (max score: 10)
    Calculation:
      - Identify swing highs/lows using a rolling window of 5 bars on each side
      - A swing high = bar whose High is the highest in a (2*window+1) range
      - A swing low  = bar whose Low  is the lowest  in a (2*window+1) range
      - Cluster nearby levels (within 1.5% of each other) into single strong levels
        — a cluster needs ≥2 touches to count as a real level
      - Find nearest support (below price) and nearest resistance (above price)
      Scoring based on proximity to support:
        ≤3%  from support + resistance exists → 10 (ideal entry zone)
        ≤7%  from support + resistance exists →  7 (reasonable zone)
        >7%  from support + resistance exists →  4 (mid-range, less ideal)
        Only support found                    →  3
        Only resistance found                 →  2
        No levels found                       →  0
    """
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
        # Group nearby levels into clusters; only keep clusters with 2+ touches
        if not raw_levels:
            return []
        raw_levels = sorted(raw_levels)
        clusters = []
        group = [raw_levels[0]]
        for level in raw_levels[1:]:
            if (level - group[0]) / group[0] <= tolerance_pct:
                group.append(level)
            else:
                if len(group) >= 2:
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
            score = 10
        elif pct_from_support <= 0.07:
            score = 7
        else:
            score = 4
    elif nearest_support is not None:
        score = 3
    elif nearest_resistance is not None:
        score = 2
    else:
        score = 0

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
    """
    NEAR SUPPORT CHECK (max score: 10)
    Calculation:
      - Find the lowest Low over the last 20 candles (recent_low)
      - If |current_price - recent_low| / current_price < 3% → price is near support → score 10
      - Otherwise → score 0
    Logic: A price hugging recent lows suggests a potential bounce zone.
    """
    print(f"[check_near_support] df rows: {len(df)}")
    current = df["Close"].iloc[-1]
    recent_low = df["Low"].tail(20).min()
    near = bool(abs(current - recent_low) / current < 0.03)
    print(f"[check_near_support] current={current:.2f}, recent_low={recent_low:.2f}, near={near}")
    return {"score": 10 if near else 0, "details": {"near_support": near}}


def check_bullish_intent(df: pd.DataFrame) -> dict:
    """
    BULLISH INTENT CHECK (max score: 10)
    Calculation:
      - Big Green Candle: body (Close - Open) is positive AND covers ≥60% of the candle's total range (High - Low)
      - Bullish Engulfing: current candle's Close > prev Open AND current Open < prev Close,
        with the previous candle being bearish (prev Open > prev Close)
      - If either condition is true → score 10, else → score 0
    Logic: These candlestick patterns signal strong buying pressure and potential reversal/continuation.
    """
    print(f"[check_bullish_intent] df rows: {len(df)}")
    last = df.iloc[-1]
    prev = df.iloc[-2]
    body = last["Close"] - last["Open"]
    prev_body = prev["Open"] - prev["Close"]

    big_green = bool(body > 0 and body > (last["High"] - last["Low"]) * 0.6)
    engulfing = bool((last["Close"] > prev["Open"]) and (last["Open"] < prev["Close"]) and prev_body > 0)

    score = 10 if (big_green or engulfing) else 0
    print(f"[check_bullish_intent] big_green={big_green}, engulfing={engulfing}, score={score}")
    return {"score": score, "details": {"big_green": big_green, "engulfing": engulfing}}


def check_sma_signal(df: pd.DataFrame) -> dict:
    """
    SMA SIGNAL CHECK (max score: 10)
    Calculation:
      - Compute SMA20 and SMA50 of Close price
      - BUY    : price > SMA20 > SMA50  → price above both averages in bullish order → score 10
      - SELL   : price < SMA20 < SMA50  → price below both averages in bearish order → score 0
      - NEUTRAL: any other arrangement                                                → score 5
    Logic: SMA alignment confirms short-to-medium term trend direction.
    """
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
    """
    EMA SIGNAL CHECK (max score: 10)
    Calculation:
      - Compute EMA9, EMA21, EMA55 using exponential weighting (more weight on recent prices)
      - BUY    : EMA9 > EMA21 > EMA55  → short-term momentum above long-term → score 10
      - SELL   : EMA9 < EMA21 < EMA55  → short-term momentum below long-term → score 0
      - NEUTRAL: any other arrangement                                        → score 5
    Logic: EMA alignment is more responsive than SMA — catches trend changes earlier.
    """
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
    """
    FIBONACCI RETRACEMENT CHECK (max score: 15)
    Calculation:
      - Find the highest High and lowest Low over the last 126 candles (~6 months)
      - Compute retracement = (high - current) / (high - low)
        → 0%   = price at the 6M high  (no retracement)
        → 100% = price at the 6M low   (full retracement)
      Scoring:
        38.2% – 61.8% retrace → HEALTHY_UPTREND  → score 15 (classic Fibonacci golden zone)
        < 38.2% retrace       → FAST_UPTREND     → score  5 (strong but may be extended)
        > 61.8% retrace       → NEUTRAL_UPTREND  → score 10 (deeper pullback, more risk)
    Logic: The golden zone (0.382–0.618) is where institutional buyers typically re-enter.
    """
    print(f"[check_fibonacci] df rows: {len(df)}")
    high = df["High"].tail(126).max()
    low = df["Low"].tail(126).min()
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
    """
    RSI CHECK (max score: 15)
    Calculation:
      - Compute 14-period RSI:
          1. Find daily price changes (diff)
          2. Separate gains (positive diffs) and losses (negative diffs)
          3. Smooth both with 14-period rolling average
          4. RS = avg_gain / avg_loss
          5. RSI = 100 - (100 / (1 + RS))
      Scoring:
        40 – 60  → HEALTHY    → score 15 (ideal swing entry momentum)
        < 30     → OVERSOLD   → score 10 (potential reversal, higher risk)
        30 – 40  → RECOVERING → score  8 (coming out of oversold)
        60 – 70  → EXTENDED   → score  5 (momentum slowing, caution)
        > 70     → OVERBOUGHT → score  0 (avoid new entries)
    """
    print(f"[check_rsi] df rows: {len(df)}")
    close = df["Close"]
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = -delta.clip(upper=0).rolling(14).mean()
    rs = gain / loss
    rsi = float((100 - (100 / (1 + rs))).iloc[-1])

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
    """
    MACD CHECK (max score: 15)
    Calculation:
      - MACD Line    = EMA12 - EMA26  (fast minus slow exponential average)
      - Signal Line  = EMA9 of MACD Line
      - Histogram    = MACD Line - Signal Line  (positive = bullish momentum)
      - Fresh crossover = histogram just flipped from ≤0 to >0 (previous bar ≤0, current bar >0)
      Scoring:
        Fresh crossover                       → FRESH_CROSSOVER   → score 15 (best entry timing)
        MACD > Signal + histogram growing     → BULLISH_MOMENTUM  → score 10 (strong continuation)
        MACD > Signal + histogram shrinking   → BULLISH_WEAKENING → score  5 (momentum fading)
        MACD < Signal                         → BEARISH           → score  0 (avoid)
    """
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

    fresh_crossover = bool(hist_val > 0 and prev_hist <= 0)
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
    """
    VOLUME CONFIRMATION CHECK (max score: 15)
    Calculation:
      - avg_volume   = mean of last 20 bars' volume (baseline)
      - volume_ratio = last bar volume / avg_volume
        → ratio > 1.0 means above-average volume
      - price_up = last Close > previous Close
      Scoring:
        Price up + volume ≥ 1.5x avg  → HIGH_VOLUME_BREAKOUT → score 15 (strong conviction)
        Price up + volume ≥ 1.0x avg  → NORMAL_VOLUME_UP    → score 10 (healthy move)
        Price up + volume < 1.0x avg  → LOW_VOLUME_UP        → score  5 (weak, may fade)
        Price down (any volume)        → SELLING_PRESSURE     → score  0 (avoid)
    Logic: Volume validates price moves — a breakout without volume is suspect.
    """
    print(f"[check_volume] df rows: {len(df)}")
    volume = df["Volume"]
    avg_volume = float(volume.tail(20).mean())
    last_volume = float(volume.iloc[-1])
    last_close = float(df["Close"].iloc[-1])
    prev_close = float(df["Close"].iloc[-2])

    volume_ratio = last_volume / avg_volume if avg_volume > 0 else 1.0
    price_up = last_close > prev_close

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
    """
    ADX (Average Directional Index) CHECK (max score: 15)
    Calculation:
      - True Range (TR) = max of:
            (High - Low),  |High - prev Close|,  |Low - prev Close|
      - +DM = upward move (High diff) when it exceeds downward move and is positive
      - -DM = downward move (Low diff) when it exceeds upward move and is positive
      - ATR     = EMA14 of True Range
      - +DI     = 100 × EMA14(+DM) / ATR  (bullish directional strength)
      - -DI     = 100 × EMA14(-DM) / ATR  (bearish directional strength)
      - DX      = 100 × |+DI - -DI| / (+DI + -DI)
      - ADX     = EMA14 of DX  (trend strength — direction-neutral)
      Scoring:
        ADX ≥ 25 + +DI > -DI  → STRONG_UPTREND   → score 15 (strongest setup)
        ADX ≥ 25 + +DI < -DI  → STRONG_DOWNTREND → score  0 (avoid)
        20 ≤ ADX < 25 + +DI > -DI → DEVELOPING_TREND → score 8 (emerging trend)
        ADX < 20               → RANGING          → score  3 (swing setups unreliable)
    """
    print(f"[check_adx] df rows: {len(df)}")
    high = df["High"]
    low = df["Low"]
    close = df["Close"]
    period = 14

    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

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


def check_52w_high(df: pd.DataFrame) -> dict:
    """
    52-WEEK HIGH CHECK (max score: 15)
    Calculation:
      - Look at the last 252 trading days (~1 year)
      - high_52w = highest Close in that period
      - low_52w  = lowest  Close in that period
      - pct_from_high = (high_52w - current) / high_52w
        → 0%  = price is AT the 52W high
        → 20% = price is 20% below the 52W high
      - fresh_breakout = last 5 days' high > 52W high × 1.001
        (0.1% buffer to avoid floating point false positives)
      Scoring:
        Fresh breakout       → BREAKOUT        → score 15 (all resistance cleared)
        ≤3%  from high       → RESISTANCE_WALL → score  3 (heavy sellers at prior high)
        ≤10% from high       → APPROACHING_HIGH→ score 10 (building toward breakout)
        ≤20% from high       → MOMENTUM_ZONE  → score 12 (best risk/reward zone)
        ≤35% from high       → MID_RANGE      → score  6 (neutral)
        >35% from high       → FAR_FROM_HIGH  → score  0 (weak/downtrend)
    """
    print(f"[check_52w_high] df rows: {len(df)}")

    year_data = df["Close"].tail(252)
    high_52w = float(year_data.max())
    low_52w = float(year_data.min())
    current = float(df["Close"].iloc[-1])
    recent_high = float(df["Close"].tail(5).max())

    pct_from_high = (high_52w - current) / high_52w

    fresh_breakout = recent_high > high_52w * 1.001

    if fresh_breakout:
        score, label = 15, "BREAKOUT"
    elif pct_from_high <= 0.03:
        score, label = 3,  "RESISTANCE_WALL"
    elif pct_from_high <= 0.10:
        score, label = 10, "APPROACHING_HIGH"
    elif pct_from_high <= 0.20:
        score, label = 12, "MOMENTUM_ZONE"
    elif pct_from_high <= 0.35:
        score, label = 6,  "MID_RANGE"
    else:
        score, label = 0,  "FAR_FROM_HIGH"

    print(f"[check_52w_high] current={current:.2f}, 52w_high={high_52w:.2f}, "
          f"52w_low={low_52w:.2f}, pct_from_high={pct_from_high:.2%}, "
          f"fresh_breakout={fresh_breakout}, label={label}")

    return {
        "score": score,
        "details": {
            "52w_high": round(high_52w, 2),
            "52w_low": round(low_52w, 2),
            "current_price": round(current, 2),
            "pct_from_52w_high": round(pct_from_high * 100, 2),
            "fresh_breakout": fresh_breakout,
            "label": label,
        }
    }