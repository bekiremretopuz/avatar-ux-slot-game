import { REEL_CONFIGS } from "./const";

export type WinLineLength = 3 | 4 | 5;

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

export interface WinCoordinate {
    col: number;
    row: number;
}

export interface WinningDetail {
    symbolId: SymbolId;
    count: number;
    ways: number;
    amount: number;
    winningCoords: WinCoordinate[];
}

export interface SpinResult {
    grid: SymbolId[][];
    totalWin: number;
    winningDetails: WinningDetail[];
}

type PayTable = Record<SymbolId, Record<WinLineLength, number>>;

// --- Configuration ---
const IS_WILD_FEATURE_ACTIVE = true; // get more wins with the wild feature, but it can be turned off for a more traditional experience
// The chosen symbol acting as the Wild.
const WILD_SYMBOL: SymbolId = "H2";

// Higher weight means the symbol lands more often.
const WEIGHTS: Record<SymbolId, number> = {
    BONUS: 2,
    H1: 5,
    H2: 90,
    H3: 10,
    H4: 12,
    H5: 15,
    H6: 18,
    M1: 20,
    M2: 25,
    M3: 30,
    M4: 35,
    M5: 40,
    M6: 45,
    A: 200,
    K: 210,
    Q: 220,
    J: 230,
    10: 240,
    9: 250,
};

// Payout multipliers based on matching 3, 4, or 5 symbols on a line.
const PAY: PayTable = {
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

const SYMBOL_KEYS = Object.keys(WEIGHTS) as SymbolId[];
const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

export class SlotMath {
    /**
     * Triggers a new spin, generates the random grid, and checks for wins.
     */
    public static spin(bet: number = 1): SpinResult {
        const { col, row } = REEL_CONFIGS.machine.dimension;

        const grid = Array.from({ length: col }, () =>
            Array.from({ length: row }, () => this.getSymbol()),
        );

        const { totalWin, details } = this.calculateWins(grid, Math.floor(bet));
        return { grid, totalWin, winningDetails: details };
    }

    /**
     * Scans the grid to find all winning ways (Left-to-Right).
     */
    private static calculateWins(
        grid: SymbolId[][],
        bet: number,
    ): { totalWin: number; details: WinningDetail[] } {
        const colCount = grid.length;

        // all possible symbols in the game (excluding the Wild) one by one.
        const allPossibleSymbols = SYMBOL_KEYS.filter((s) => s !== WILD_SYMBOL);

        const details = allPossibleSymbols
            .map((symbol) => {
                const multipliers: number[] = [];
                const winCoords: WinCoordinate[] = [];

                // Look for matches across consecutive reels.
                for (let c = 0; c < colCount; c++) {
                    const matchedRows: number[] = [];

                    grid[c].forEach((s, r) => {
                        // A cell matches if it's the exact symbol or a substitute Wild.
                        const isMatch =
                            s === symbol ||
                            (IS_WILD_FEATURE_ACTIVE && s === WILD_SYMBOL);

                        if (isMatch) {
                            matchedRows.push(r);
                        }
                    });

                    // Break the chain if no matches are found in this reel.
                    if (!matchedRows.length) break;

                    multipliers.push(matchedRows.length);
                    matchedRows.forEach((r) =>
                        winCoords.push({ col: c, row: r }),
                    );
                }

                // We need at least 3 matching reels to trigger a payout.
                if (multipliers.length < 3) return null;

                // Multiply ways across reels (e.g., 2 symbols on reel 1 * 3 symbols on reel 2 = 6 ways).
                const ways = multipliers.reduce((a, b) => a * b, 1);
                const length = multipliers.length as WinLineLength;

                const amount = Math.floor(
                    (PAY[symbol][length] || 0) * ways * bet,
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
            .filter((d): d is NonNullable<typeof d> => d !== null);

        const totalWin = details.reduce((sum, d) => sum + d.amount, 0);
        return { totalWin, details };
    }

    /**
     * Grabs a random symbol based on defined probabilities (weights).
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
