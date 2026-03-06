import {
    gradeColor,
    scoreColor,
    fmt,
    encodeIndex,
    statusLabel,
    statusColor,
} from "./utils";

describe("gradeColor", () => {
    it("A+ → emerald", () => expect(gradeColor("A+")).toBe("text-emerald-400"));
    it("A  → green", () => expect(gradeColor("A")).toBe("text-green-400"));
    it("B  → lime", () => expect(gradeColor("B")).toBe("text-lime-400"));
    it("C  → amber", () => expect(gradeColor("C")).toBe("text-amber-400"));
    it("D  → red", () => expect(gradeColor("D")).toBe("text-red-400"));
    it("unknown → grey", () => expect(gradeColor(null)).toBe("text-gray-400"));
});

describe("scoreColor", () => {
    it("score 90 → emerald", () =>
        expect(scoreColor(90)).toBe("text-emerald-400"));
    it("score 75 → green", () => expect(scoreColor(75)).toBe("text-green-400"));
    it("score 65 → lime", () => expect(scoreColor(65)).toBe("text-lime-400"));
    it("score 55 → amber", () => expect(scoreColor(55)).toBe("text-amber-400"));
    it("score 40 → red", () => expect(scoreColor(40)).toBe("text-red-400"));
});

describe("fmt", () => {
    it("formats a number to 2 decimal places by default", () =>
        expect(fmt(3.14159)).toBe("3.14"));
    it("respects custom decimal places", () =>
        expect(fmt(3.14159, 4)).toBe("3.1416"));
    it("returns fallback for undefined", () =>
        expect(fmt(undefined)).toBe("—"));
    it("returns fallback for null", () => expect(fmt(null)).toBe("—"));
    it("returns fallback for NaN", () => expect(fmt(NaN)).toBe("—"));
    it("handles zero correctly", () => expect(fmt(0)).toBe("0.00"));
    it("accepts a custom fallback string", () =>
        expect(fmt(undefined, 2, "N/A")).toBe("N/A"));
});

describe("encodeIndex", () => {
    it("encodes spaces as %20", () =>
        expect(encodeIndex("NIFTY 50")).toBe("NIFTY%2050"));
    it("handles multi-word indices", () =>
        expect(encodeIndex("NIFTY NEXT 50")).toBe("NIFTY%20NEXT%2050"));
    it("leaves already-clean strings unchanged", () =>
        expect(encodeIndex("NIFTYIT")).toBe("NIFTYIT"));
});

describe("statusLabel", () => {
    it("≥70 → Bullish", () => expect(statusLabel(75)).toBe("Bullish"));
    it("40–69 → Neutral", () => expect(statusLabel(50)).toBe("Neutral"));
    it("<40 → Bearish", () => expect(statusLabel(20)).toBe("Bearish"));
    it("undefined → N/A", () => expect(statusLabel(undefined)).toBe("N/A"));
});

describe("statusColor", () => {
    it("Bullish → green", () =>
        expect(statusColor("Bullish")).toBe("text-green-400"));
    it("Neutral → amber", () =>
        expect(statusColor("Neutral")).toBe("text-amber-400"));
    it("Bearish → red", () =>
        expect(statusColor("Bearish")).toBe("text-red-400"));
    it("N/A → grey", () => expect(statusColor("N/A")).toBe("text-gray-500"));
});
