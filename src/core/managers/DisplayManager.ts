import { Application, Graphics } from "pixi.js";
import { game } from "../../main";
import { GameEvent } from "..";

export const GAME_WIDTH = 1680;
export const GAME_HEIGHT = 945;

/**
 * DisplayManager is responsible for scaling and centering
 * the PIXI stage to fit the available screen space while
 * preserving the original game aspect ratio.
 */
export class DisplayManager {
    private app: Application;
    private rootMask: Graphics;

    constructor(app: Application) {
        this.app = app;

        // Create a rectangular mask to hide overflow
        this.rootMask = new Graphics()
            .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
            .fill(0xffffff);

        // Apply mask to the main stage
        this.app.stage.addChild(this.rootMask);
        this.app.stage.mask = this.rootMask;

        // Bind resize method to preserve class context
        this.resize = this.resize.bind(this);

        // Listen for window resize events
        window.addEventListener("resize", this.resize);

        // Listen fullscreen events. Its better than listen resize event.
        window.addEventListener("fullscreenchange", this.resize);
        window.addEventListener("webkitfullscreenchange", this.resize);

        // Perform initial layout
        this.resize();

        // For pyhsics update.
        this.app.ticker.add((delta) => {
            game.events.emit(GameEvent.FIXED_UPDATE, { delta });
        });
    }

    /**
     * Resizes and centers the PIXI stage based on the container size.
     * Applies letterboxing if aspect ratios do not match.
     */
    private resize(): void {
        if (!this.app || !this.app.renderer) return;

        const gameContainer = document.getElementById("app");
        if (!gameContainer) return;
        // Next tick
        requestAnimationFrame(() => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Calculate uniform scale to maintain aspect ratio
            const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);

            // Apply scale to the root stage
            this.app.stage.scale.set(scale);

            // Resize renderer to fill the container
            this.app.renderer.resize(width, height);

            // Center the stage with letterboxing
            this.app.stage.position.set(width / 2, height / 2);
            this.app.stage.pivot.set(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        });
    }

    /**
     * Cleans up event listeners when the manager is no longer needed.
     */
    public destroy(): void {
        window.removeEventListener("resize", this.resize);
        window.removeEventListener("fullscreenchange", this.resize);
        window.removeEventListener("webkitfullscreenchange", this.resize);

        if (this.rootMask) {
            this.rootMask.destroy();
        }
    }
}
