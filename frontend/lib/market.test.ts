import { isMarketOpen, getNextMarketEvent } from "./market";

/** Helper: build a Date in IST by specifying IST time components */
function makeIST(
    year: number,
    month: number, // 1-based
    day: number,
    hour: number,
    minute: number,
): Date {
    // Create UTC date then subtract IST offset so toIST() gives back the intended time
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const utcMs = Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MS;
    return new Date(utcMs);
}

describe("isMarketOpen", () => {
    // 2026-03-09 is a Monday
    it("returns true during trading hours on a weekday (10:00 IST)", () => {
        expect(isMarketOpen(makeIST(2026, 3, 9, 10, 0))).toBe(true);
    });

    it("returns true at exactly market open (09:15 IST)", () => {
        expect(isMarketOpen(makeIST(2026, 3, 9, 9, 15))).toBe(true);
    });

    it("returns false at exactly market close (15:30 IST)", () => {
        expect(isMarketOpen(makeIST(2026, 3, 9, 15, 30))).toBe(false);
    });

    it("returns false before market open (09:00 IST)", () => {
        expect(isMarketOpen(makeIST(2026, 3, 9, 9, 0))).toBe(false);
    });

    it("returns false after market close (16:00 IST)", () => {
        expect(isMarketOpen(makeIST(2026, 3, 9, 16, 0))).toBe(false);
    });

    it("returns false on Saturday", () => {
        // 2026-03-07 is a Saturday
        expect(isMarketOpen(makeIST(2026, 3, 7, 11, 0))).toBe(false);
    });

    it("returns false on Sunday", () => {
        // 2026-03-08 is a Sunday
        expect(isMarketOpen(makeIST(2026, 3, 8, 11, 0))).toBe(false);
    });
});

describe("getNextMarketEvent", () => {
    it("returns a Closes-in label when market is open", () => {
        const { label } = getNextMarketEvent(makeIST(2026, 3, 9, 12, 0));
        expect(label).toMatch(/^Closes in/);
    });

    it("secondsUntil is positive when market is open", () => {
        const { secondsUntil } = getNextMarketEvent(makeIST(2026, 3, 9, 12, 0));
        expect(secondsUntil).toBeGreaterThan(0);
    });

    it("returns an Opens-in label when market is closed (evening)", () => {
        const { label } = getNextMarketEvent(makeIST(2026, 3, 9, 18, 0));
        expect(label).toMatch(/^Opens in/);
    });

    it("returns an Opens-in label on a Saturday", () => {
        const { label } = getNextMarketEvent(makeIST(2026, 3, 7, 10, 0));
        expect(label).toMatch(/^Opens in/);
    });
});
