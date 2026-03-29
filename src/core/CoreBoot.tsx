import { Application, Container, Ticker } from "pixi.js";
import {
    AssetLoader,
    DisplayManager,
    EventContext,
    EventEmitter,
} from "./managers";
import { manifest } from "../game/utils/assetsManifest";
import { createRoot } from "react-dom/client";
import { GameUI } from "./dom-components/GameUI";
import { GAME_CONFIG } from "../game/misc/const";

// Type definition for splash screen class
export type SplashScreenConstructor = new () => Container & {
    onProgress: (p: number) => void;
};

export class CoreBoot {
    private app: Application; // PixiJS application instance
    private splashScreen?: InstanceType<SplashScreenConstructor>; // Splash screen instance
    public events!: EventContext; // Global event system

    constructor() {
        // Initialize Pixi application
        this.app = new Application();
    }

    public async init(SplashScreenClass: SplashScreenConstructor) {
        // Initialize Pixi app with background and responsive resize
        await this.app.init({
            background: "#130c0f", // Canvas background color
            resizeTo: window, // Auto-resize to browser window
            resolution: Math.min(window.devicePixelRatio || 1, 2), // Cap resolution at 2x for Retina
            autoDensity: true, // Scales canvas CSS for crisp rendering
            antialias: true, // Smooths out vector edges
            roundPixels: true, // Prevents blurry textures by rounding coords
            preserveDrawingBuffer: false, // Better performance (no screenshot support)
            premultipliedAlpha: true, // Better transparency blending
            preferWebGLVersion: 2, // Forces WebGL 2 if available
            powerPreference: "high-performance", // Prioritizes raw GPU power
            backgroundAlpha: 1, // Opaque background (improves performance)
            clearBeforeRender: true, // Prevents ghosting/trails
            hello: true, // Logs PixiJS version to console
        });

        const gameContainer = document.getElementById("app");

        // --- Create UI root container for React ---
        const uiRoot = document.createElement("div");
        uiRoot.id = "ui-root";
        Object.assign(uiRoot.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            zIndex: "9999",
            pointerEvents: "none",
            display: "block",
            visibility: "visible",
        });
        document.body.appendChild(uiRoot);

        // --- Mount React UI ---
        const root = createRoot(uiRoot);
        root.render(
            <GameUI
                fixedBetAmount={GAME_CONFIG.FIXED_BET_AMOUNT}
                balance={GAME_CONFIG.INITIAL_CREDITS}
            />,
        );

        // Attach Pixi canvas and UI root to DOM
        if (gameContainer) {
            gameContainer.appendChild(this.app.canvas);
            gameContainer.appendChild(uiRoot);
        }

        // --- Setup global event system ---
        const emitter = new EventEmitter();
        this.events = new EventContext(emitter);

        // --- Initialize display manager ---
        new DisplayManager(this.app);

        // --- Load splash assets ---
        const loader = new AssetLoader(manifest);
        await loader.load(
            manifest,
            (progress) => {
                console.log(
                    "assets downloading for loadingScreen: [background and logo]",
                    Math.round(progress * 100) + "%",
                );
            },
            ["splash"],
        );

        const preloader = document.getElementById("preloader");
        if (preloader) {
            // Remove preloader from DOM after splash preloader assets are loaded
            preloader.remove();
        }

        // --- Create and display splash screen ---
        this.splashScreen = new SplashScreenClass();
        this.app.stage.addChild(this.splashScreen);

        console.log("-----INIT LOADING SCREEN-----");

        // --- Load all game assets ---
        await loader.load(
            manifest,
            (progress) => {
                console.log(
                    "all game assets downloading: ",
                    Math.round(progress * 100) + "%",
                );
                // Update splash screen progress
                this.splashScreen?.onProgress?.(progress);
            },
            ["game"],
        );
    }

    // Expose Pixi ticker for game loop updates
    public get ticker(): Ticker {
        return this.app.ticker;
    }
}
