import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { Machine, MACHINE_EVENTS } from "./Machine";
import { Reel } from "./Reel";
import { REEL_CONFIGS } from "../../misc/const";
import { game } from "../../../main";
import { GameEvent } from "../../../core";

export class SlotMechanism extends Container {
    private _machine!: Machine;

    constructor() {
        super();

        /** Initialize the logical machine controller */
        this._machine = new Machine();

        /** Create and position the visual frame of the slot panel */
        const panelFrame = new Sprite(Texture.from("slotFrame"));
        panelFrame.scale.set(1.095, 1.2);
        panelFrame.position.set(340, 124);
        this.addChild(panelFrame);

        /** Create a container to hold the reel visual objects */
        const reelContainer = new Container();
        reelContainer.addChild(...this._machine.reels);
        this.addChild(reelContainer);

        /** * Create a mask to hide symbols moving outside
         * of the visible 5x3 game area
         */
        const spinMask = new Graphics()
            .fill({ color: 0xffffff, alpha: 0.25 })
            .roundRect(
                360,
                150,
                REEL_CONFIGS.symbol.width * 5,
                REEL_CONFIGS.symbol.height * 3,
                10,
            )
            .endFill();

        reelContainer.mask = spinMask;
        this.addChild(spinMask);

        /** Listen for animation status changes from the core game engine */
        game.events.on(GameEvent.MACHINE_ANIMATION_STATUS, (e) => {
            this.onMachineEventHandler(e.status);
        });
    }

    /** Triggers the start of the reel rotation animation */
    public startSpin(): void {
        this._machine.startSpin();
    }

    /** * Initiates the stopping sequence by providing
     * the final result symbols to the machine
     */
    public stopSpin(finalSymbols: string[][]): void {
        this._machine.stopSpin(finalSymbols);
    }

    /** Emits internal machine events to external listeners (e.g. UI) */
    public onMachineEventHandler(action: MACHINE_EVENTS): void {
        this.emit("animationstatus", action);
    }

    /** Returns true if at least one reel is still in motion */
    public isSpinning(): boolean {
        return !this._machine.allStopped();
    }

    /** Accessor for the reel objects array */
    public get reels(): Reel[] {
        return this._machine.reels;
    }
}
