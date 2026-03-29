// Default fallback values - Updated dynamically from game-config.json during Splash screen
export const GAME_CONFIG = {
    INITIAL_CREDITS: 10000,
    FIXED_BET_AMOUNT: 100,
    LOCALES: "en-US",
    CURRENCY: "USD",
};

/**
 * Formats numeric values using dynamic locales and currency settings.
 * Uses Intl.NumberFormat for native localized currency strings.
 */
export const formatCurrency = (
    amount: number,
    showDecimals: boolean = false,
): string => {
    return new Intl.NumberFormat(GAME_CONFIG.LOCALES, {
        style: "currency",
        currency: GAME_CONFIG.CURRENCY,
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
};

/**
 * Global configuration for the Slot Machine mechanics and layout.
 */
export const REEL_CONFIGS = {
    // Individual symbol dimensions and boundary rules
    symbol: {
        width: 200,
        height: 200,
        border: 500, // Vertical threshold for symbol recycling (2.5 * height)
        totalHeight: 800, // Combined height of a single reel's viewable area
    },

    // Machine structure and initial symbol strips (Pseudo-reels)
    machine: {
        dimension: { col: 5, row: 3 },
        pseudo: [
            // Reel strips for columns 1 through 5 (Shuffled for a natural look)
            [
                "H3",
                "M1",
                "9",
                "Q",
                "H5",
                "A",
                "M4",
                "H2",
                "BONUS",
                "M6",
                "10",
                "H4",
                "J",
                "M2",
                "H1",
                "K",
                "M3",
                "H6",
                "M5",
            ],
            [
                "BONUS",
                "M3",
                "H2",
                "A",
                "H6",
                "M1",
                "10",
                "Q",
                "H4",
                "M5",
                "J",
                "H1",
                "M4",
                "9",
                "K",
                "H5",
                "M2",
                "M6",
                "H3",
            ],
            [
                "M5",
                "H1",
                "K",
                "M2",
                "H4",
                "9",
                "M6",
                "H2",
                "A",
                "H6",
                "BONUS",
                "M1",
                "J",
                "Q",
                "H5",
                "M4",
                "10",
                "H3",
                "M3",
            ],
            [
                "H6",
                "Q",
                "M4",
                "10",
                "H3",
                "A",
                "M1",
                "H5",
                "J",
                "M6",
                "BONUS",
                "H2",
                "K",
                "M3",
                "9",
                "H1",
                "M5",
                "M2",
                "H4",
            ],
            [
                "M2",
                "BONUS",
                "H5",
                "J",
                "M4",
                "9",
                "H1",
                "Q",
                "M6",
                "H3",
                "A",
                "H6",
                "M3",
                "10",
                "K",
                "H4",
                "M5",
                "H2",
                "M1",
            ],
        ],
    },

    // Spin physics and animation timing constants
    reel: {
        maxFullRotationProgress: 1, // Normalized progress for a complete spin cycle
        overSpinProgress: 0.03, // "Bounce" effect at the end of a spin
        defaultDecelarationFactor: 7, // Speed reduction rate during the stop phase
        maxSpeed: 0.14, // Top spinning velocity (pixels/frame normalized)
    },
};
