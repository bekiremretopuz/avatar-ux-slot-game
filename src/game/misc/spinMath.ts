import { REEL_CONFIGS } from "./const";

/**
 * Slot machine symbol identifiers.
 */
export type SymbolId =
    | "BONUS"
    | "H1"
    | "H2"
    | "H3"
    | "H4"
    | "H5"
    | "H6"
    | "M1"
    | "M2"
    | "M3"
    | "M4"
    | "M5"
    | "M6"
    | "A"
    | "K"
    | "Q"
    | "J"
    | "10"
    | "9";

// --- Static Configuration (Pre-calculated for performance) ---
const WEIGHTS: Record<string, number> = {
    BONUS: 2,
    H1: 6,
    H2: 8,
    H3: 10,
    H4: 12,
    H5: 14,
    H6: 16,
    M1: 25,
    M2: 30,
    M3: 35,
    M4: 40,
    M5: 45,
    M6: 50,
    A: 70,
    K: 80,
    Q: 90,
    J: 100,
    10: 110,
    9: 120,
};

const SYMBOL_KEYS = Object.keys(WEIGHTS) as SymbolId[];
const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

const PAY: any = {
    BONUS: { 3: 200, 4: 1000, 5: 5000 },
    H1: { 3: 100, 4: 250, 5: 1000 },
    H2: { 3: 80, 4: 200, 5: 800 },
    H3: { 3: 60, 4: 150, 5: 600 },
    H4: { 3: 50, 4: 120, 5: 500 },
    H5: { 3: 40, 4: 100, 5: 400 },
    H6: { 3: 30, 4: 80, 5: 300 },
    M1: { 3: 25, 4: 60, 5: 200 },
    M2: { 3: 20, 4: 50, 5: 180 },
    M3: { 3: 15, 4: 45, 5: 150 },
    M4: { 3: 12, 4: 40, 5: 120 },
    M5: { 3: 10, 4: 35, 5: 100 },
    M6: { 3: 8, 4: 30, 5: 80 },
    A: { 3: 5, 4: 20, 5: 60 },
    K: { 3: 4, 4: 15, 5: 50 },
    Q: { 3: 3, 4: 12, 5: 45 },
    J: { 3: 2, 4: 10, 5: 40 },
    10: { 3: 1, 4: 5, 5: 30 },
    9: { 3: 1, 4: 3, 5: 20 },
};

export class SlotMath {
    /**
     * Entry point for a spin. Generates grid and calculates all wins.
     */
    public static spin(bet: number = 1) {
        const { col, row } = REEL_CONFIGS.machine.dimension;

        // Generate grid using weighted RNG
        const grid = Array.from({ length: col }, () =>
            Array.from({ length: row }, () => this.getSymbol()),
        );

        const { totalWin, details } = this.calculateWins(grid, Math.floor(bet));

        return { grid, totalWin, winningDetails: details };
    }

    /**
     * Logic to calculate all winning "Ways" on the grid.
     */
    private static calculateWins(grid: SymbolId[][], bet: number) {
        const colCount = grid.length;

        const details = [...new Set(grid[0])]
            .map((symbol) => {
                const multipliers: number[] = [];
                const winCoords: { col: number; row: number }[] = [];

                for (let c = 0; c < colCount; c++) {
                    const rows = grid[c]
                        .map((s, r) => (s === symbol ? r : -1))
                        .filter((r) => r !== -1);
                    if (!rows.length) break;

                    multipliers.push(rows.length);
                    rows.forEach((r) => winCoords.push({ col: c, row: r }));
                }

                // Minimum 3 consecutive reels required
                if (multipliers.length < 3) return null;

                const ways = multipliers.reduce((a, b) => a * b, 1);
                const payTable = PAY[symbol];

                // Calculate final integer amount
                const amount = Math.floor(
                    (payTable[multipliers.length] || 0) * ways * bet,
                );

                return amount > 0
                    ? {
                          symbolId: symbol,
                          count: multipliers.length,
                          ways,
                          amount,
                          winningCoords: winCoords,
                      }
                    : null;
            })
            .filter(Boolean);

        const totalWin = details.reduce((sum, d) => sum + (d?.amount || 0), 0);

        return { totalWin, details };
    }

    /**
     * Weighted random selection.
     */
    private static getSymbol(): SymbolId {
        let rand = Math.random() * TOTAL_WEIGHT;
        for (const key of SYMBOL_KEYS) {
            if (rand < WEIGHTS[key]) return key;
            rand -= WEIGHTS[key];
        }
        return SYMBOL_KEYS[SYMBOL_KEYS.length - 1];
    }
}
