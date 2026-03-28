import { GameEvent } from "../../../core";
import { game } from "../../../main";
import { GAME_CONFIG, REEL_CONFIGS } from "../../misc/const";
import { SlotMath } from "../../misc/spinMath";
import { Reel } from "./Reel";
import { Symbols } from "./Symbols";

// Reel states
enum REEL_STATES {
    IDLE,
    SPINNING,
    STOPPING,
    STOPPED,
}

// Machine events
export enum MACHINE_EVENTS {
    SPINNING = "SPINNING",
    STOPPING = "REEL_STOPPING",
    STOPPED = "REEL_STOPPED",
    COMPLETE = "SPIN_COMPLETE",
}

export class Machine {
    private _symbols: Symbols[] = []; // All symbols from reels
    private _reels: Reel[] = []; // Reel instances
    private _reelPositions: number[] = []; // Current symbol index per reel
    private _stopFlags: boolean[] = []; // Flags indicating reels ready to stop
    private _reelStates: REEL_STATES[] = []; // Current state of each reel
    private _finalSymbols?: string[][]; // Target symbols after spin
    private _spinTimeFactor = 1; // Speed multiplier for stopping
    private _minSpin = 2.5; // Minimum spin duration in seconds
    private _defSpin = 3.5; // Default spin duration in seconds
    private pseudo: string[][] = []; // Symbol grid for reels

    constructor() {
        const cols = REEL_CONFIGS.machine.dimension.col;
        this.pseudo = REEL_CONFIGS.machine.presudo;

        // --- Create reels ---
        this._reels = Array.from({ length: cols }, (_, i) => {
            const reel = new Reel(this, i);
            reel.position.set(364 + i, 350); // Set reel position
            this._symbols.push(...reel.symbols); // Collect symbols
            reel.addChild(...reel.symbols); // Add symbols to display
            return reel;
        });

        // Initialize flags and states
        this._stopFlags = Array(cols).fill(false);
        this._reelPositions = Array(cols).fill(0);
        this._reelStates = Array(cols).fill(REEL_STATES.IDLE);

        // --- Generate test spin result ---
        const response2 = SlotMath.spin(GAME_CONFIG.FIXED_BET_AMOUNT);

        // Start spin after 2 seconds
        setTimeout(() => this.startSpin(), 2000);

        // Stop spin after 7 seconds using generated symbols
        setTimeout(() => this.stopSpin(response2.grid), 7000);

        console.log(response2); // Log spin result
    }

    /** Start all reels spinning */
    startSpin() {
        this._stopFlags.fill(false);
        this._finalSymbols = undefined;
        this._reels.forEach((r) => r.startSpin());
    }

    /** Stop reels and set final symbols */
    stopSpin(symbols: string[][]) {
        this._finalSymbols = symbols;
        this._stopFlags[0] = true; // Enable first reel to stop
    }

    /** Check if a reel should stop */
    shouldStop(col: number) {
        if (!this._finalSymbols) return false;
        const elapsed = Date.now() / 1000 - this._reels[col].startTime;
        return (
            elapsed >= this._minSpin &&
            elapsed >= this._defSpin &&
            this._stopFlags[col]
        );
    }

    /** Get the final symbol for a specific reel and row */
    getFinalSymbolAt(col: number, row: number) {
        if (!this._finalSymbols) throw new Error("final symbols not ready");
        const rows = REEL_CONFIGS.machine.dimension.row;
        return this._finalSymbols[col][(row + rows) % rows];
    }

    /** Mark the next reel to stop */
    markNextToStop(col: number) {
        this._stopFlags[(col + 1) % this._reels.length] = true;
    }

    /** Get the next symbol for a reel */
    getNextSymbolAt(col: number) {
        const pos = this._reelPositions[col];
        const symbol = this.pseudo[col][pos];
        this._reelPositions[col] = (pos + 1) % this.pseudo[col].length;
        return symbol;
    }

    /** Check if all reels have stopped */
    allStopped() {
        return this._reelStates.every((s) => s === REEL_STATES.STOPPED);
    }

    /** Emit reel state change and trigger events */
    private emitReelState(
        col: number,
        state: REEL_STATES,
        event: MACHINE_EVENTS,
    ) {
        this._reelStates[col] = state;
        game.events.emit(GameEvent.MACHINE_ANIMATION_STATUS, {
            status: event,
            column: col,
        });
    }

    /** Reel started stopping */
    reelStopping(col: number) {
        this.emitReelState(col, REEL_STATES.STOPPING, MACHINE_EVENTS.STOPPING);
    }

    /** Reel started spinning */
    reelSpinning(col: number) {
        this.emitReelState(col, REEL_STATES.SPINNING, MACHINE_EVENTS.SPINNING);
    }

    /** Reel stopped completely */
    reelStopped(col: number) {
        this.emitReelState(col, REEL_STATES.STOPPED, MACHINE_EVENTS.STOPPED);
        if (this.allStopped()) {
            // Emit complete event if all reels stopped
            game.events.emit(GameEvent.MACHINE_ANIMATION_STATUS, {
                status: MACHINE_EVENTS.COMPLETE,
            });
        }
    }

    /** Calculate symbol coordinates on the reel */
    getSymbolCoordinate(col: number, row: number) {
        return {
            x: REEL_CONFIGS.symbol.width * col,
            y: REEL_CONFIGS.symbol.height * (row - 1),
        };
    }

    /** Spin speed factor getter/setter */
    get spinTimeFactor() {
        return this._spinTimeFactor;
    }
    set spinTimeFactor(v: number) {
        this._spinTimeFactor = v;
    }

    /** Getters for reels and symbols */
    get reels() {
        return this._reels;
    }
    get symbols() {
        return this._symbols;
    }
}
