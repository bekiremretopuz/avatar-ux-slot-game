import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { Machine, MACHINE_EVENTS } from "./Machine";
import { GAME_CONFIG, REEL_CONFIGS } from "../../misc/const";
import { game } from "../../../main";
import { GameEvent } from "../../../core";
import { SlotMath, SpinResult, WinningDetail } from "../../misc/spinMath";
import { gsap } from "gsap";
import { updateUIWin } from "../../../core/dom-components/GameUI";
import { FloatingWinText } from "../FloatingText";

export class SlotMechanism extends Container {
    private _machine!: Machine;
    private _currentResponse: SpinResult | null = null;
    private _spinDelayCall: gsap.core.Animation | null = null;
    private _winText!: FloatingWinText;

    public postConstruct(): void {
        this._setupFrame();
        this._machine = new Machine();

        // Create a wrapper for the reels to apply masking properly
        const reelContainer = new Container();
        reelContainer.addChild(...this._machine.reels);
        this.addChild(reelContainer);

        // Initialize the floating text that shows win values
        this._winText = new FloatingWinText();
        this._winText.position.set(864, 462);
        this.addChild(this._winText);

        this._setupMask(reelContainer);

        // --- Event listeners ---
        game.events.on(GameEvent.UI_START_MACHINE, this.startSpin);
        game.events.on(GameEvent.UI_STOP_MACHINE, this.handleQuickStop);
        game.events.on(GameEvent.GAME_MACHINE_ANIMATION_STATUS, (data) => {
            if (data.status === MACHINE_EVENTS.COMPLETE) {
                this._handleSpinComplete();
            }
        });
    }
    /**
     * Triggered when the player clicks the Spin button.
     * Handles state clearing and communicates with the game core for results.
     */
    public startSpin = (): void => {
        this._winText.stopAndComplete();
        this._resetSymbolsVisuals();

        this._currentResponse = SlotMath.spin(GAME_CONFIG.FIXED_BET_AMOUNT);
        console.log("Spin Response: ", this._currentResponse);

        this._machine.startSpin();

        this._spinDelayCall = gsap.delayedCall(3.5, this.executeStop);
    };

    /**
     * Triggered when the machine finishes its stop animation sequence.
     */
    private _handleSpinComplete(): void {
        if (!this._currentResponse) return;
        const { totalWin, winningDetails } = this._currentResponse;

        // If there are wins, kick off the win display sequence
        if (totalWin > 0 && winningDetails) {
            this._startWinCelebration(winningDetails, totalWin);
        }
        this._currentResponse = null;
    }

    /**
     * Handles dimming non-winning symbols, highlighting the winning ones,
     * and triggering the floating text.
     */
    private _startWinCelebration(
        winningDetails: WinningDetail[],
        totalWin: number,
    ): void {
        // 1. Dim all symbols to create visual focus
        this._machine.reels.forEach((reel) =>
            reel.symbols.forEach((s) => s.setDim(true)),
        );

        // 2. Brighten winning symbols and play their idle loop animations
        winningDetails.forEach((detail) => {
            detail.winningCoords.forEach((pos) => {
                const symbol = this._machine.reels[pos.col].symbols.find(
                    (s) => s.row === pos.row,
                );
                if (symbol) {
                    symbol.setDim(false);
                    symbol.playWinAnimation();
                }
            });
        });

        // 3. Trigger the floating text animation
        if (totalWin > 0) {
            this._winText.showWin(totalWin, () => {
                // updateUIWin updates React states: adds to both 'win' and 'currentBalance'
                updateUIWin(totalWin);
            });
        }
    }

    /**
     * Clears all visual states, stops GSAP tweens, and scales symbols back to default.
     */
    private _resetSymbolsVisuals(): void {
        this._machine.reels.forEach((reel) => {
            reel.symbols.forEach((symbol) => {
                symbol.setDim(false);
                symbol.stopWinAnimation();
                gsap.killTweensOf(symbol.scale);
                symbol.scale.set(1);
            });
        });
    }

    /**
     * Triggered when the user clicks spin again before the scheduled stop.
     */
    private handleQuickStop = (): void => {
        this._clearDelayCall();
        if (!this._currentResponse) return;
        this._machine.stopSpin(this._currentResponse.grid, true);
    };

    /**
     * Natural stop routine called after the 3.5s delay concludes.
     */
    private executeStop = (): void => {
        if (!this._currentResponse) return;
        this._machine.stopSpin(this._currentResponse.grid);
    };

    /**
     * Clears the scheduled GSAP delayed call to prevent out-of-sync stops.
     */
    private _clearDelayCall(): void {
        if (this._spinDelayCall) {
            this._spinDelayCall.kill();
            this._spinDelayCall = null;
        }
    }

    /**
     * Renders the static outer frame bounding the slot machine grid.
     */
    private _setupFrame(): void {
        const panelFrame = new Sprite(Texture.from("slotFrame"));
        panelFrame.scale.set(1.095, 1.2);
        panelFrame.position.set(340, 124);
        this.addChild(panelFrame);
    }

    /**
     * Restricts the visible bounds of symbols so spinning doesn't leak out of the frame.
     */
    private _setupMask(container: Container): void {
        const spinMask = new Graphics()
            .roundRect(
                360,
                150,
                REEL_CONFIGS.symbol.width * 5,
                REEL_CONFIGS.symbol.height * 3,
                10,
            )
            .fill({ color: 0xffffff, alpha: 0.25 });
        container.mask = spinMask;
        this.addChild(spinMask);
    }

    /**
     * Lifecyle destroy method ensuring no active event listeners or timers produce memory leaks.
     */
    public destroy(options?: any): void {
        game.events.off(GameEvent.UI_START_MACHINE, this.startSpin);
        game.events.off(GameEvent.UI_STOP_MACHINE, this.handleQuickStop);
        this._clearDelayCall();
        super.destroy(options);
    }
}
