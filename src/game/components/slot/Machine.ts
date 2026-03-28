import { GameEvent } from "../../../core";
import { game } from "../../../main";
import { REEL_CONFIGS } from "../../misc/const";
import { Reel } from "./Reel";
import { Symbols } from "./Symbols";

export enum REEL_STATES {
    IDLE,
    SPINNING,
    STOPPING,
    STOPPED,
}
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
    private _spinTimeFactor = 1;
    private _minimalSpinningTime!: number;
    private _defaultSpinningTime!: number;
    private _finalSymbols?: string[][];
    private pseudo: Array<Array<string>> = [[], [], [], [], [], []];
    constructor() {
        this.createMachine();
        setTimeout(() => {
            this.startSpin();
        }, 2000);

        setTimeout(() => {
            this.stopSpin([
                ["H1", "H2", "H3"],
                ["H1", "H2", "H3"],
                ["H1", "H2", "H3"],
                ["H1", "H2", "H3"],
                ["H1", "H2", "H3"],
            ]);
        }, 7000);
    }

    private createMachine(): void {
        this._minimalSpinningTime = 2.5;
        this._defaultSpinningTime = 3.5;
        this.pseudo = REEL_CONFIGS.machine.presudo;
        for (let i = 0; i < REEL_CONFIGS.machine.dimension.col; i++) {
            this._reelPositions.push(0);
            this._stopFlags.push(false);
            const reel = new Reel(this, i);
            reel.position.set(364 + i, 350);
            this._symbols.push(...reel.symbols);
            reel.addChild(...reel.symbols);
            this._reels.push(reel);
        }
    }

    public startSpin(): void {
        this._stopFlags = [false, false, false, false, false];
        this._finalSymbols = undefined;
        this._reels.forEach((item) => item.startSpin());
    }

    public stopSpin(symbols: string[][]): void {
        this._finalSymbols = symbols;
        this._stopFlags[0] = true;
    }

    public isFinalSymbolsRevieved(): boolean {
        return this._finalSymbols !== undefined;
    }

    public shouldStop(column: number): boolean {
        const nowInSec = new Date().getTime() * 0.001;
        const isTime =
            nowInSec - this._reels[column].startTime >=
            this._minimalSpinningTime;
        const isSpinTime =
            nowInSec - this._reels[column].startTime >=
            this._defaultSpinningTime;
        return (
            this.isFinalSymbolsRevieved() &&
            isTime &&
            isSpinTime &&
            this._stopFlags[column]
        );
    }

    public getFinalSymbolAt(col: number, row: number): string {
        if (this._finalSymbols) {
            return this._finalSymbols[col][
                (row + REEL_CONFIGS.machine.dimension.row) %
                    REEL_CONFIGS.machine.dimension.row
            ];
        } else {
            throw new Error("final symbols not ready");
        }
    }

    public markNextToStop(col: number): void {
        this._stopFlags[(col + 1) % this._reels.length] = true;
    }

    public getNextSymbolAt(column: number): string {
        const pos = this._reelPositions[column];
        const len = this.pseudo[column].length;
        let symbol = this.pseudo[column][pos];
        const nowInSec = new Date().getTime() * 0.001;
        const readyToStop =
            this.isFinalSymbolsRevieved() &&
            nowInSec - this._reels[column].startTime >=
                this._minimalSpinningTime &&
            this._stopFlags[column];
        this._reelPositions[column] = ++this._reelPositions[column] % len;
        if (readyToStop && pos % 50 == 0) {
            symbol = "A";
        }
        return symbol;
    }

    public allStopped(): boolean {
        for (let i = 0; i < this._reelStates.length; i++) {
            if (this._reelStates[i] !== REEL_STATES.STOPPED) return false;
        }
        return true;
    }

    public reelStopping(column: number): void {
        this._reelStates[column] = REEL_STATES.STOPPING;
        game.events.emit(GameEvent.MACHINE_ANIMATION_STATUS, {
            status: MACHINE_EVENTS.STOPPING,
            column,
        });
    }

    public reelSpinning(column: number): void {
        this._reelStates[column] = REEL_STATES.SPINNING;
        game.events.emit(GameEvent.MACHINE_ANIMATION_STATUS, {
            status: MACHINE_EVENTS.SPINNING,
            column,
        });
    }

    public reelStopped(column: number): void {
        this._reelStates[column] = REEL_STATES.STOPPED;
        game.events.emit(GameEvent.MACHINE_ANIMATION_STATUS, {
            status: MACHINE_EVENTS.STOPPED,
        });
        if (this.allStopped())
            game.events.emit(GameEvent.MACHINE_ANIMATION_STATUS, {
                status: MACHINE_EVENTS.COMPLETE,
            });
    }

    public getSymbolCoordinate(
        col: number,
        row: number,
    ): { x: number; y: number } {
        return {
            x: REEL_CONFIGS.symbol.width * col,
            y: REEL_CONFIGS.symbol.height * (row - 1),
        };
    }

    public hasSymbol(symbol: string): (number | undefined)[] | undefined {
        const result = this._finalSymbols?.filter(
            (item) => item.indexOf(symbol) > -1,
        );
        const found = result?.map((item) => this._finalSymbols?.indexOf(item));
        return found;
    }

    public get finalSymbols(): ReadonlyArray<ReadonlyArray<string>> {
        return this._finalSymbols as string[][];
    }

    public get spinTimeFactor(): number {
        return this._spinTimeFactor;
    }

    public set spinTimeFactor(value: number) {
        this._spinTimeFactor = value;
    }

    public get reels(): Reel[] {
        return this._reels;
    }

    public get symbols(): Symbols[] {
        return this._symbols;
    }
}
