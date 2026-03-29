import { GameEvent } from "../../../core";
import { game } from "../../../main";
import { REEL_CONFIGS } from "../../misc/const";
import { Reel } from "./Reel";
import { Symbols } from "./Symbols";

/** Represents the possible states of an individual reel */
enum REEL_STATES {
    IDLE,
    SPINNING,
    STOPPING,
    STOPPED,
}

/** Events emitted by the machine to track global animation status */
export enum MACHINE_EVENTS {
    SPINNING = "SPINNING",
    STOPPING = "REEL_STOPPING",
    STOPPED = "REEL_STOPPED",
    COMPLETE = "SPIN_COMPLETE",
}

export class Machine {
    private _symbols: Symbols[] = [];
    private _reels: Reel[] = [];
    private _reelPositions: number[] = [];
    private _stopFlags: boolean[] = [];
    private _reelStates: REEL_STATES[] = [];
    private _finalSymbols?: string[][];
    private _spinTimeFactor = 1;
    private _minSpin = 0.1; // Minimum allowed duration before a reel can land
    private pseudo: string[][] = [];

    constructor() {
        this.pseudo = REEL_CONFIGS.machine.pseudo;
        this._initMachine();
    }

    /** Sets up reels, flags, and initial states */
    private _initMachine(): void {
        const cols = REEL_CONFIGS.machine.dimension.col;

        this._reels = Array.from({ length: cols }, (_, i) => {
            const reel = new Reel(this, i);
            // X: 364 is the starting offset, i is incremented per column
            // Y: 350 is the vertical anchor point
            reel.position.set(364 + i, 350);

            this._symbols.push(...reel.symbols);
            reel.addChild(...reel.symbols);
            return reel;
        });

        this._stopFlags = Array(cols).fill(false);
        this._reelPositions = Array(cols).fill(0);
        this._reelStates = Array(cols).fill(REEL_STATES.IDLE);
    }

    /** Resets flags and triggers the spin animation for all reels */
    public startSpin(): void {
        this._stopFlags.fill(false);
        this._finalSymbols = undefined;
        this._reelStates.fill(REEL_STATES.SPINNING);
        this._reels.forEach((r) => r.startSpin());
    }

    /** * Initiates the stopping sequence.
     * @param symbols The target grid to land on.
     * @param isQuickStop If true, triggers a rapid staggered stop across all columns.
     */
    public stopSpin(symbols: string[][], isQuickStop: boolean = false): void {
        this._finalSymbols = symbols;

        if (isQuickStop) {
            // Rapid staggered stop: release all columns with a 50ms delay between each
            this._reels.forEach((_, i) => {
                this._stopFlags[i] = true;
            });
        } else {
            // Sequential stop: only release the first column; others follow via markNextToStop
            this._stopFlags[0] = true;
        }
    }

    /** Checks if a specific reel has met the criteria to start landing */
    public shouldStop(col: number): boolean {
        if (!this._finalSymbols) return false;

        const elapsed = Date.now() / 1000 - this._reels[col].startTime;
        return elapsed >= this._minSpin && this._stopFlags[col];
    }

    /** Returns the target symbol string for a specific grid position */
    public getFinalSymbolAt(col: number, row: number): string {
        if (!this._finalSymbols)
            throw new Error("Machine: Final symbols are not set.");
        const rows = REEL_CONFIGS.machine.dimension.row;
        return this._finalSymbols[col][(row + rows) % rows];
    }

    /** Signals the next column in line that it is allowed to stop */
    public markNextToStop(col: number): void {
        const nextCol = col + 1;
        if (nextCol < this._reels.length) {
            this._stopFlags[nextCol] = true;
        }
    }

    /** Retrieves the next symbol from the pseudo-random grid for continuous spinning */
    public getNextSymbolAt(col: number): string {
        const pos = this._reelPositions[col];
        const symbol = this.pseudo[col][pos];
        this._reelPositions[col] = (pos + 1) % this.pseudo[col].length;
        return symbol;
    }

    /** Returns true if all reels have reached the STOPPED state */
    public allStopped(): boolean {
        return this._reelStates.every((s) => s === REEL_STATES.STOPPED);
    }

    /** Internal helper to update state and notify the game core */
    private _emitReelState(
        col: number,
        state: REEL_STATES,
        event: MACHINE_EVENTS,
    ): void {
        this._reelStates[col] = state;
        game.events.emit(GameEvent.GAME_MACHINE_ANIMATION_STATUS, {
            status: event,
            column: col,
        });
    }

    // --- State Notification Hooks (called by individual Reels) ---

    public reelStopping(col: number): void {
        this._emitReelState(col, REEL_STATES.STOPPING, MACHINE_EVENTS.STOPPING);
    }

    public reelSpinning(col: number): void {
        this._emitReelState(col, REEL_STATES.SPINNING, MACHINE_EVENTS.SPINNING);
    }

    public reelStopped(col: number): void {
        this._emitReelState(col, REEL_STATES.STOPPED, MACHINE_EVENTS.STOPPED);

        if (this.allStopped()) {
            game.events.emit(GameEvent.GAME_MACHINE_ANIMATION_STATUS, {
                status: MACHINE_EVENTS.COMPLETE,
            });
        }
    }

    /** Calculates the local coordinates for a symbol within its reel */
    public getSymbolCoordinate(col: number, row: number) {
        return {
            // Add width/2 so the symbol is positioned correctly even with anchor 0.5
            x: REEL_CONFIGS.symbol.width * col + REEL_CONFIGS.symbol.width / 2,
            y:
                REEL_CONFIGS.symbol.height * (row - 1) +
                REEL_CONFIGS.symbol.height / 2,
        };
    }

    // --- Getters & Setters ---

    public get spinTimeFactor(): number {
        return this._spinTimeFactor;
    }
    public set spinTimeFactor(v: number) {
        this._spinTimeFactor = v;
    }

    public get reels(): Reel[] {
        return this._reels;
    }
    public get symbols(): Symbols[] {
        return this._symbols;
    }
}
