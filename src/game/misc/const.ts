// Default fallback values - Updated dynamically from game-config.json during Splash screen
export const GAME_CONFIG = {
    INITIAL_CREDITS: 2,
    FIXED_BET_AMOUNT: 1,
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
        presudo: [
            // Reel strips for columns 1 through 5
            [
                "10",
                "9",
                "A",
                "BONUS",
                "H1",
                "H2",
                "H3",
                "H4",
                "H5",
                "H6",
                "J",
                "K",
                "M1",
                "M2",
                "M3",
                "M4",
                "M5",
                "M6",
                "Q",
            ],
            [
                "10",
                "9",
                "A",
                "BONUS",
                "H1",
                "H2",
                "H3",
                "H4",
                "H5",
                "H6",
                "J",
                "K",
                "M1",
                "M2",
                "M3",
                "M4",
                "M5",
                "M6",
                "Q",
            ],
            [
                "10",
                "9",
                "A",
                "BONUS",
                "H1",
                "H2",
                "H3",
                "H4",
                "H5",
                "H6",
                "J",
                "K",
                "M1",
                "M2",
                "M3",
                "M4",
                "M5",
                "M6",
                "Q",
            ],
            [
                "10",
                "9",
                "A",
                "BONUS",
                "H1",
                "H2",
                "H3",
                "H4",
                "H5",
                "H6",
                "J",
                "K",
                "M1",
                "M2",
                "M3",
                "M4",
                "M5",
                "M6",
                "Q",
            ],
            [
                "10",
                "9",
                "A",
                "BONUS",
                "H1",
                "H2",
                "H3",
                "H4",
                "H5",
                "H6",
                "J",
                "K",
                "M1",
                "M2",
                "M3",
                "M4",
                "M5",
                "M6",
                "Q",
            ],
        ],
    },

    // Spin physics and animation timing constants
    reel: {
        maxFullRotationProgress: 1, // Normalized progress for a complete spin cycle
        overSpinProgress: 0.02, // "Bounce" effect at the end of a spin
        defaultDecelarationFactor: 7, // Speed reduction rate during the stop phase
        maxSpeed: 0.14, // Top spinning velocity (pixels/frame normalized)
    },
};
