import { Assets, AssetsManifest } from "pixi.js";

export type ProgressCallback = (progress: number) => void;

/**
 * AssetLoader handles loading asset bundles with progress tracking
 * and prevents already-loaded bundles from being loaded again.
 */
export class AssetLoader {
    /** Keeps track of bundles that have already been loaded */
    private loaded = new Set<string>();

    constructor(manifest: AssetsManifest) {
        // Assets system must be initialized only once
        Assets.init({ manifest });
    }

    /**
     * Loads asset bundles defined in a PIXI AssetsManifest.
     *
     * @param manifest - PIXI assets manifest configuration
     * @param onProgress - Optional callback reporting loading progress (0–1)
     * @param bundles - Optional list of bundle names to load
     */
    async load(
        manifest: AssetsManifest,
        onProgress?: ProgressCallback,
        bundles?: string[],
    ): Promise<void> {
        // Select bundles to load (all or filtered)
        const list = bundles
            ? manifest.bundles.filter((b) => bundles.includes(b.name))
            : manifest.bundles;

        if (!list.length) return;

        const total = list.reduce(
            (sum, bundle) => sum + Object.keys(bundle.assets).length,
            0,
        );

        let current = 0;
        // Progress tick called by PIXI on each loaded asset
        const tick = () => onProgress?.(++current / total);

        // Load each bundle once
        for (const bundle of list) {
            if (this.loaded.has(bundle.name)) continue;

            // Default PIXI asset loading (all gfx)
            await Assets.loadBundle(bundle.name, tick);
            this.loaded.add(bundle.name);
        }
    }
}
