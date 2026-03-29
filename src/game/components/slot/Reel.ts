import { gsap } from "gsap";
import { Machine } from "./Machine";
import { Container } from "pixi.js";
import { Symbols } from "./Symbols";
import { REEL_CONFIGS } from "../../misc/const";
import { game } from "../../../main";
import { GameEvent } from "../../../core";

export class Reel extends Container {
    private _symbols: Symbols[] = [];
    private _progress = 0;
    private speedFactor = 1;
    private acc = 0.01;
    private _startTime = 0;
    private speed = 0.02;
    private stop = false;
    private first = 0;

    constructor(
        private machine: Machine,
        private column: number,
    ) {
        super();
        this.createSymbols();
    }

    /** Initial symbol creation based on pseudo configurations */
    private createSymbols() {
        for (let i = -1; i < REEL_CONFIGS.machine.dimension.row; i++) {
            const rowSymbols = REEL_CONFIGS.machine.pseudo[i + 1];
            const type =
                rowSymbols[Math.floor(Math.random() * rowSymbols.length)];
            const symbol = new Symbols(type, i, this.column);
            const pos = this.machine.getSymbolCoordinate(this.column, i);
            symbol.position.set(pos.x, pos.y);
            this._symbols.push(symbol);
        }
    }

    /** Triggered when the spin button is pressed */
    startSpin() {
        this._progress = 0;
        this.speed = 0.1; // starting speed
        this.stop = false;
        this.resetPositions();
        this._startTime = Date.now() / 1000;
        // Listen to fixed update for smooth rotation
        game.events.on(GameEvent.PHYSICS_FIXED_UPDATE, this.resolveSpinning);
        this.machine.reelSpinning(this.column);
    }

    /** Reset symbol positions before starting a new spin */
    resetPositions() {
        this._symbols.forEach((s, r) => {
            const p = this.machine.getSymbolCoordinate(this.column, r - 1);
            s.position.set(p.x, p.y);
        });
    }

    /** Calculate frame delta ratio for frame-independent movement */
    private calcDeltaRatio() {
        return Math.floor(gsap.ticker.deltaRatio(60) * 10) / 10;
    }

    /** Main loop while the reel is accelerating or at constant speed */
    private resolveSpinning = () => {
        if (this.machine.shouldStop(this.column) && this.progress >= 1) {
            game.events.off(
                GameEvent.PHYSICS_FIXED_UPDATE,
                this.resolveSpinning,
            );
            const corr = Math.ceil(this.progress) - this.progress;
            this.progress += corr;
            this.resolveStopping(0);
        } else {
            this.progress += this.speed * this.calcDeltaRatio();
            this.speed = Math.min(
                this.speed + this.acc,
                REEL_CONFIGS.reel.maxSpeed * this.speedFactor,
            );
        }
    };

    /** Handles the deceleration and bounce effect when stopping */
    private resolveStopping(i: number) {
        let prog = i + REEL_CONFIGS.reel.maxFullRotationProgress;
        const bounce =
            REEL_CONFIGS.reel.overSpinProgress * this.machine.spinTimeFactor;
        const end = prog + this.progress;

        const decel = () => {
            !this.stop && this.preStop();
            let ease =
                Math.max(
                    prog /
                        ((REEL_CONFIGS.reel.defaultDecelarationFactor * 1.2) /
                            2),
                    this.acc * 2,
                ) * this.calcDeltaRatio();

            prog -= ease;
            this.progress = Math.min(end + bounce, this.progress + ease);

            if (this.progress >= end + bounce) {
                game.events.off(GameEvent.PHYSICS_FIXED_UPDATE, decel);
                // Snap back to final position with a small bounce ease
                gsap.to(this, {
                    progress: end,
                    duration: 0.1,
                    onComplete: () => this.machine.reelStopped(this.column),
                });
            }
        };
        game.events.on(GameEvent.PHYSICS_FIXED_UPDATE, decel);
        decel();
    }

    /** Logic triggered just before the reel comes to a full stop */
    private preStop() {
        this.stop = true;
        // Mark the next reel to stop after a short delay to create a staggered stopping effect
        gsap.delayedCall(1.1 - this.speedFactor, () =>
            this.machine.markNextToStop(this.column),
        );
        this.machine.reelStopping(this.column);
    }

    /** Map logical row to actual symbol array index */
    private getSymbolPosition(t: number) {
        return (t + this.first + 1) % (REEL_CONFIGS.machine.dimension.row + 1);
    }

    getSymbol(row: number) {
        return this._symbols[this.getSymbolPosition(row)];
    }

    /** Inject final result symbols provided by the machine logic */
    private finalSymbol(symbol: Symbols) {
        symbol.type = this.machine.getFinalSymbolAt(this.column, symbol.row);
    }

    get progress() {
        return this._progress;
    }

    /** Setter for progress that handles symbol wrapping and position updates */
    set progress(dt: number) {
        const n = (dt - this._progress) * REEL_CONFIGS.symbol.totalHeight;
        this._progress = dt;
        let i = this.first;

        for (let s = this._symbols.length - 1; s >= 0; s--) {
            const symbol = this.getSymbol(s - 1);
            symbol.y += n;

            // Recycling symbols: when a symbol goes off-screen, move it to the top
            if (symbol.y >= REEL_CONFIGS.symbol.border) {
                symbol.y -= REEL_CONFIGS.symbol.totalHeight;
                this.updateSymbol(symbol);
                if (--i < 0) i = REEL_CONFIGS.machine.dimension.row;
                if (this.stop) this.finalSymbol(symbol);
            }
        }
        this.first = i;
    }

    /** Update symbol type and motion blur state during spin */
    updateSymbol(symbol: Symbols) {
        symbol.type = this.machine.getNextSymbolAt(this.column);
        symbol.isBlurred = this.hasFullSpeed();
    }

    hasFullSpeed() {
        return !this.machine.shouldStop(this.column) && this.speedFactor >= 1;
    }

    get symbols() {
        return this._symbols;
    }

    get startTime() {
        return this._startTime;
    }
}
