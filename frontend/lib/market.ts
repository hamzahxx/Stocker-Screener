// NSE market hours: Monday–Friday, 09:15–15:30 IST (UTC+5:30)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const OPEN_HOUR = 9;
const OPEN_MIN = 15;
const CLOSE_HOUR = 15;
const CLOSE_MIN = 30;

function toIST(date: Date): Date {
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000;
    return new Date(utcMs + IST_OFFSET_MS);
}

function minutesFromMidnight(h: number, m: number): number {
    return h * 60 + m;
}

/** Returns true when the NSE market is currently open (Mon–Fri, 09:15–15:30 IST). */
export function isMarketOpen(now: Date = new Date()): boolean {
    const ist = toIST(now);
    const day = ist.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) return false;

    const current = minutesFromMidnight(ist.getHours(), ist.getMinutes());
    const open = minutesFromMidnight(OPEN_HOUR, OPEN_MIN);
    const close = minutesFromMidnight(CLOSE_HOUR, CLOSE_MIN);
    return current >= open && current < close;
}

export interface MarketEvent {
    /** Human-readable label, e.g. "Closes in 1h 24m" or "Opens in 6h 45m" */
    label: string;
    /** Seconds until the next market open or close */
    secondsUntil: number;
}

/**
 * Returns the next significant market event relative to `now`:
 * - If market is open → next close
 * - If market is closed → next open (skips weekends)
 */
export function getNextMarketEvent(now: Date = new Date()): MarketEvent {
    const ist = toIST(now);
    const day = ist.getDay();
    const current = minutesFromMidnight(ist.getHours(), ist.getMinutes());
    const openMin = minutesFromMidnight(OPEN_HOUR, OPEN_MIN);
    const closeMin = minutesFromMidnight(CLOSE_HOUR, CLOSE_MIN);

    let minutesUntil: number;
    let label: string;

    if (isMarketOpen(now)) {
        minutesUntil = closeMin - current;
        label = `Closes in ${formatDuration(minutesUntil)}`;
    } else {
        // Find minutes until next weekday open
        let daysAhead = 0;
        let searchDay = day;
        let minsToday = openMin - current;

        if (minsToday <= 0 || searchDay === 0 || searchDay === 6) {
            // Today's open has passed or today is weekend — look forward
            daysAhead = 1;
            searchDay = (day + 1) % 7;
            while (searchDay === 0 || searchDay === 6) {
                daysAhead++;
                searchDay = (day + daysAhead) % 7;
            }
            minutesUntil = daysAhead * 24 * 60 - current + openMin;
        } else {
            minutesUntil = minsToday;
        }
        label = `Opens in ${formatDuration(minutesUntil)}`;
    }

    return { label, secondsUntil: minutesUntil * 60 };
}

function formatDuration(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}
