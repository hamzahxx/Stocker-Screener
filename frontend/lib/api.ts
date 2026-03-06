// ─── Types ────────────────────────────────────────────────────────────────────

export interface IndicatorDetail {
    score: number;
    details: Record<string, unknown>;
    weighted_score?: number;
    pct_of_max?: number;
}

export type ChecksMap = Record<string, IndicatorDetail>;

export interface StockResult {
    ticker: string;
    final_score: number;
    grade: string | null;
    checks: ChecksMap;
    /** Present when the stock failed to score */
    error?: string;
}

export interface ApiError {
    status: number;
    message: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
}

function getApiKey(): string {
    return process.env.NEXT_PUBLIC_API_KEY ?? "";
}

async function apiFetch<T>(path: string): Promise<T> {
    // Route through the Next.js rewrite proxy (/api/screener/* → localhost:8000/*)
    // to avoid CORS. Falls back to direct URL only in SSR/server contexts.
    const isServer = typeof window === "undefined";
    const url = isServer ? `${getBaseUrl()}${path}` : `/api/screener${path}`;
    const res = await fetch(url, {
        headers: {
            "X-API-Key": getApiKey(),
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (!res.ok) {
        let message = res.statusText;
        try {
            const body = await res.json();
            message = body?.detail ?? body?.message ?? message;
        } catch {
            // body not JSON — use statusText as-is
        }
        const err: ApiError = { status: res.status, message };
        throw err;
    }

    return res.json() as Promise<T>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch all stocks in an NSE index ranked by swing trade score.
 * @param index URL-encoded index slug, e.g. "NIFTY%2050"
 */
export async function fetchIndexScreener(
    index: string,
): Promise<StockResult[]> {
    return apiFetch<StockResult[]>(`/screen/swing/${index}`);
}

/**
 * Fetch the full technical breakdown for a single NSE stock.
 * @param ticker Uppercase NSE ticker, e.g. "RELIANCE"
 */
export async function fetchEquity(ticker: string): Promise<StockResult> {
    return apiFetch<StockResult>(`/screen/equity/${ticker.toUpperCase()}`);
}
