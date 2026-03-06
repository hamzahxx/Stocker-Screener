export interface MetricMeta {
    key: string;
    label: string;
    weight: number; // percentage, 0–100
    informational: boolean; // true = weight 0%, shown but not scored
    tooltip: string;
    maxRawScore: number;
}

export const METRIC_LABELS: MetricMeta[] = [
    {
        key: "rsi",
        label: "RSI — Relative Strength Index",
        weight: 20,
        informational: false,
        maxRawScore: 15,
        tooltip:
            "Measures how overbought or oversold a stock is on a scale of 0–100. A value of 40–60 signals healthy momentum (ideal swing entry). Above 70 means overbought (avoid), below 30 means oversold (potential bounce). Calculated over the last 14 trading days.",
    },
    {
        key: "macd",
        label: "MACD — Moving Average Convergence Divergence",
        weight: 20,
        informational: false,
        maxRawScore: 15,
        tooltip:
            "Compares a fast (12-day) and slow (26-day) exponential average to detect trend shifts. A positive histogram (MACD line above signal line) means bullish momentum is building. A fresh crossover (histogram just turned positive) is the strongest signal.",
    },
    {
        key: "uptrend",
        label: "Long-Term Uptrend (SMA 200)",
        weight: 15,
        informational: false,
        maxRawScore: 15,
        tooltip:
            "Checks if the stock price is currently trading above its 200-day Simple Moving Average. Being above SMA200 is the most widely used institutional benchmark for confirming a long-term uptrend.",
    },
    {
        key: "adx",
        label: "ADX — Average Directional Index",
        weight: 15,
        informational: false,
        maxRawScore: 15,
        tooltip:
            "Measures the strength of the current trend (not its direction). ADX above 25 confirms a strong trend is in place. The higher the ADX, the stronger and more reliable the trend signal.",
    },
    {
        key: "52w_high",
        label: "52-Week High Proximity",
        weight: 10,
        informational: false,
        maxRawScore: 15,
        tooltip:
            "Shows how close the current price is to the stock's highest price over the past year. Stocks near their 52-week high are often in a strong breakout phase and tend to continue higher.",
    },
    {
        key: "volume",
        label: "Volume Confirmation",
        weight: 10,
        informational: false,
        maxRawScore: 15,
        tooltip:
            "Checks whether recent trading volume supports the price movement. A price move backed by above-average volume is more reliable. High volume on up-days confirms institutional buying interest.",
    },
    {
        key: "sma",
        label: "SMA Signal (20 / 50-day)",
        weight: 10,
        informational: false,
        maxRawScore: 10,
        tooltip:
            "Checks the alignment of the 20-day and 50-day Simple Moving Averages relative to the current price. BUY = price > SMA20 > SMA50 (bullish stack). SELL = price < SMA20 < SMA50. NEUTRAL = mixed.",
    },
    {
        key: "fibonacci",
        label: "Fibonacci Retracement",
        weight: 5,
        informational: false,
        maxRawScore: 15,
        tooltip:
            'Uses the last 6 months\' price range to check if the stock has pulled back into the "golden zone" (38.2%–61.8% retracement). This zone is where institutional traders typically re-enter a trend.',
    },
    {
        key: "support_resistance",
        label: "Support & Resistance Levels",
        weight: 3,
        informational: false,
        maxRawScore: 10,
        tooltip:
            "Identifies key price levels where the stock has historically reversed or stalled. Being close to a strong support level (within 3–7%) suggests a lower-risk entry point.",
    },
    {
        key: "near_support",
        label: "Near Recent Support",
        weight: 2,
        informational: false,
        maxRawScore: 10,
        tooltip:
            "Checks if the current price is within 3% of the lowest price over the last 20 trading days. A price hugging this recent low may indicate a potential bounce zone.",
    },
    {
        key: "bullish_intent",
        label: "Bullish Intent (Candlestick)",
        weight: 0,
        informational: true,
        maxRawScore: 10,
        tooltip:
            "Detects powerful bullish candlestick patterns: a Big Green Candle (body is ≥60% of the candle's range) or a Bullish Engulfing pattern. These signal strong buying pressure. Currently informational — not included in the final score.",
    },
];

/** Lookup a metric by its key. Returns undefined if not found. */
export function getMetric(key: string): MetricMeta | undefined {
    return METRIC_LABELS.find((m) => m.key === key);
}
