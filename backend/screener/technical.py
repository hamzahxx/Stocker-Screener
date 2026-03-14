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


def check_sma_cross(df: pd.DataFrame) -> dict:
    """
    SMA CROSS CHECK (max score: 10)
    Detects golden cross (SMA20 crosses above SMA50) within last 10 bars.
    A fresh cross is the setup signal; already-aligned is a weaker continuation.
    """
    close = df["Close"]
    sma20 = close.rolling(20).mean()
    sma50 = close.rolling(50).mean()

    # Check if SMA20 crossed above SMA50 within the last 10 bars
    recent_golden_cross = False
    lookback = min(10, len(sma20) - 1)
    for i in range(len(sma20) - lookback, len(sma20)):
        if sma20.iloc[i - 1] <= sma50.iloc[i - 1] and sma20.iloc[i] > sma50.iloc[i]:
            recent_golden_cross = True
            break

    price    = close.iloc[-1]
    sma20_v  = sma20.iloc[-1]
    sma50_v  = sma50.iloc[-1]

    if recent_golden_cross:
        signal, score = "GOLDEN_CROSS", 10    # best: fresh initiation
    elif price > sma20_v > sma50_v:
        signal, score = "BUY", 5              # trend running, less actionable
    elif price < sma20_v < sma50_v:
        signal, score = "SELL", 0
    else:
        signal, score = "NEUTRAL", 3

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
    Rewards RSI recovering FROM oversold, not sitting in a comfortable zone.
    RSI momentum (rising vs 5 bars ago) separates real recovery from dead-cat bounces.
    """
    print(f"[check_rsi] df rows: {len(df)}")
    close = df["Close"]
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = -delta.clip(upper=0).rolling(14).mean()
    rs = gain / loss
    rsi_series = 100 - (100 / (1 + rs))
    rsi = float(rsi_series.iloc[-1])

    # RSI momentum: is RSI rising vs 5 bars ago?
    rsi_5ago = float(rsi_series.iloc[-6]) if len(rsi_series) >= 6 else rsi
    rsi_rising = rsi > rsi_5ago + 2  # at least 2 points = meaningful shift

    if 25 <= rsi <= 45 and rsi_rising:
        score, label = 15, "EARLY_RECOVERY"      # best: oversold AND recovering
    elif 25 <= rsi <= 45:
        score, label = 10, "OVERSOLD_BASE"        # base forming, no momentum yet
    elif rsi < 25:
        score, label = 8, "DEEPLY_OVERSOLD"       # potential but risky
    elif 45 < rsi <= 60:
        score, label = 5, "NEUTRAL"               # mid-range, less edge
    elif 60 < rsi <= 70:
        score, label = 2, "EXTENDED"              # momentum fading
    else:
        score, label = 0, "OVERBOUGHT"            # avoid

    print(f"[check_rsi] rsi={rsi:.2f}, rsi_5ago={rsi_5ago:.2f}, rising={rsi_rising}, label={label}")
    return {
        "score": score,
        "details": {
            "rsi": round(rsi, 2),
            "rsi_5ago": round(rsi_5ago, 2),
            "rsi_rising": rsi_rising,
            "rsi_label": label,
        },
    }


def check_macd(df: pd.DataFrame) -> dict:
    """
    MACD CHECK (max score: 15)
    Rewards the histogram CONVERGING toward zero (building crossover) more than
    an already-completed crossover. By the time histogram flips positive,
    the first chunk of the move is done.
    """
    print(f"[check_macd] df rows: {len(df)}")
    close = df["Close"]
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    histogram = macd_line - signal_line

    macd_val = float(macd_line.iloc[-1])
    signal_val = float(signal_line.iloc[-1])
    hist_val = float(histogram.iloc[-1])
    prev_hist = float(histogram.iloc[-2])
    prev2_hist = float(histogram.iloc[-3])

    fresh_crossover = bool(hist_val > 0 and prev_hist <= 0)
    building = bool(
        hist_val < 0 and prev_hist < 0
        and hist_val > prev_hist and prev_hist > prev2_hist
    )
    bullish = bool(macd_val > signal_val)
    histogram_growing = bool(hist_val > prev_hist)

    if building:
        score, label = 15, "BUILDING_CROSSOVER"    # best: about to cross
    elif fresh_crossover:
        score, label = 13, "FRESH_CROSSOVER"       # just crossed, still early
    elif bullish and histogram_growing:
        score, label = 5, "BULLISH_MOMENTUM"        # trend running, late
    elif bullish:
        score, label = 2, "BULLISH_WEAKENING"       # fading
    else:
        score, label = 0, "BEARISH"

    print(f"[check_macd] macd={macd_val:.4f}, signal={signal_val:.4f}, hist={hist_val:.4f}, label={label}")
    return {
        "score": score,
        "details": {
            "macd": round(macd_val, 4),
            "signal": round(signal_val, 4),
            "histogram": round(hist_val, 4),
            "macd_label": label,
        },
    }


def volume_confirmation(df: pd.DataFrame) -> dict:
    """
    VOLUME CHECK (max score: 15)
    Rewards accumulation patterns: volume drying up (institutions quietly buying)
    followed by a volume spike on a green candle = breakout from accumulation.
    Penalises high volume on red candles (distribution).
    """
    print(f"[check_volume] df rows: {len(df)}")
    volume = df["Volume"]
    close = df["Close"]

    avg_vol_recent = float(volume.tail(10).mean())
    avg_vol_prior = float(volume.iloc[-30:-10].mean()) if len(volume) >= 30 else avg_vol_recent
    last_volume = float(volume.iloc[-1])

    vol_trend = avg_vol_recent / avg_vol_prior if avg_vol_prior > 0 else 1.0
    vol_drying = vol_trend < 0.8  # recent volume < 80% of prior = drying up

    last_close = float(close.iloc[-1])
    prev_close = float(close.iloc[-2])
    price_up = last_close > prev_close

    vol_spike = last_volume > avg_vol_recent * 1.5 if avg_vol_recent > 0 else False

    if vol_drying and vol_spike and price_up:
        score, label = 15, "ACCUMULATION_BREAKOUT"   # best: quiet period then volume surge
    elif vol_drying and not vol_spike:
        score, label = 10, "ACCUMULATION"             # building base, institutions loading
    elif price_up and vol_spike:
        score, label = 8, "HIGH_VOLUME_UP"            # strong but could be late
    elif price_up:
        score, label = 5, "NORMAL_UP"
    elif not price_up and vol_spike:
        score, label = 0, "DISTRIBUTION"              # selling, avoid
    else:
        score, label = 3, "QUIET"

    print(f"[check_volume] vol_trend={vol_trend:.2f}, spike={vol_spike}, drying={vol_drying}, label={label}")
    return {
        "score": score,
        "details": {
            "volume_ratio": round(vol_trend, 2),
            "vol_spike": vol_spike,
            "vol_drying": vol_drying,
            "volume_label": label,
        },
    }


def check_adx(df: pd.DataFrame) -> dict:
    """
    ADX CHECK (max score: 15)
    Inverted from traditional use: rewards LOW ADX (ranging) with +DI crossing
    above -DI — that's the moment a new trend STARTS, not a confirmed trend.
    High ADX (≥25) means the trend is mature and most profits are taken.
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
    adx_series = dx.ewm(span=period).mean()

    adx = float(adx_series.iloc[-1])
    prev_adx = float(adx_series.iloc[-2])
    plus_di_val = float(plus_di.iloc[-1])
    minus_di_val = float(minus_di.iloc[-1])

    adx_rising = adx > prev_adx
    trending_up = bool(plus_di_val > minus_di_val)

    # Detect +DI crossing above -DI within last 5 bars
    di_crossover = False
    for i in range(-5, 0):
        prev_plus = float(plus_di.iloc[i - 1])
        prev_minus = float(minus_di.iloc[i - 1])
        curr_plus = float(plus_di.iloc[i])
        curr_minus = float(minus_di.iloc[i])
        if prev_plus <= prev_minus and curr_plus > curr_minus:
            di_crossover = True
            break

    if adx < 20 and di_crossover:
        score, label = 15, "TREND_INITIATION"       # best: new trend starting from flat
    elif 18 <= adx < 25 and trending_up and adx_rising:
        score, label = 12, "TREND_BUILDING"          # trend emerging
    elif adx < 20 and trending_up:
        score, label = 8, "EARLY_SETUP"              # directional but no momentum yet
    elif adx >= 25 and trending_up:
        score, label = 5, "CONFIRMED_TREND"          # late, trend mature
    elif adx >= 25 and not trending_up:
        score, label = 0, "STRONG_DOWNTREND"         # avoid
    else:
        score, label = 2, "RANGING_BEARISH"

    print(f"[check_adx] adx={adx:.2f}, +DI={plus_di_val:.2f}, -DI={minus_di_val:.2f}, "
          f"di_cross={di_crossover}, label={label}")
    return {
        "score": score,
        "details": {
            "adx": round(adx, 2),
            "plus_di": round(plus_di_val, 2),
            "minus_di": round(minus_di_val, 2),
            "di_crossover": di_crossover,
            "adx_label": label,
        },
    }


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