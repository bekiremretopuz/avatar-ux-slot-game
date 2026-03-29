import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { Machine, MACHINE_EVENTS } from "./Machine";
import { GAME_CONFIG, REEL_CONFIGS } from "../../misc/const";
import { game } from "../../../main";
import { GameEvent } from "../../../core";
import { SlotMath, SpinResult, WinningDetail } from "../../misc/spinMath";
import { gsap } from "gsap";
import { FloatingWinText } from "../FloatingText";

export class SlotMechanism extends Container {
    private machine!: Machine;
    private currentResponse: SpinResult | null = null;
    private spinDelayCall: gsap.core.Animation | null = null;
    private winText!: FloatingWinText;

    public postConstruct(): void {
        this.setupFrame();
        this.machine = new Machine();

        // Create a wrapper for the reels to apply masking properly
        const reelContainer = new Container();
        reelContainer.addChild(...this.machine.reels);
        this.addChild(reelContainer);

        // Initialize the floating text that shows win values
        this.winText = new FloatingWinText();
        this.winText.position.set(864, 462);
        this.addChild(this.winText);

        this.setupMask(reelContainer);
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        game.events.on(GameEvent.UI_START_MACHINE, this.startSpin);
        game.events.on(GameEvent.UI_STOP_MACHINE, this.handleQuickStop);
        game.events.on(
            GameEvent.GAME_MACHINE_ANIMATION_STATUS,
            this.onAnimationStatusChange,
        );
    }

    /**
     * Triggered when the player clicks the Spin button.
     */
    public startSpin = (): void => {
        this.winText.stopAndComplete();
        this.resetSymbolsVisuals();

        // Tip: In the future, consider injecting SlotMath or moving this to a Controller/Command
        this.currentResponse = SlotMath.spin(GAME_CONFIG.FIXED_BET_AMOUNT);
        console.log("Spin Response: ", this.currentResponse);

        this.machine.startSpin();

        // Kept at 0.6 as per your functional code, updated the comment below
        this.spinDelayCall = gsap.delayedCall(0.6, this.executeStop);
    };

    private onAnimationStatusChange = (data: { status: string }): void => {
        if (data.status === MACHINE_EVENTS.COMPLETE) {
            this._handleSpinComplete();
        }
    };

    /**
     * Triggered when the machine finishes its stop animation sequence.
     */
    private _handleSpinComplete(): void {
        if (!this.currentResponse) return;

        // If an action (win/freespin/bonus) handles the response, we just clean up
        this.resolveNextAction();
        this.currentResponse = null;
    }

    /**
     * Resolves the next outcome in priority order: win first, then free spins, then bonus.
     */
    private resolveNextAction(): boolean {
        return (
            this.resolveWinAction() ||
            this.resolveFreeSpinAction() ||
            this.resolveBonusAction()
        );
    }

    private resolveWinAction(): boolean {
        const response = this.currentResponse;
        if (!response || response.totalWin <= 0 || !response.winningDetails) {
            return false;
        }

        this.startWinCelebration(response.winningDetails, response.totalWin);
        return true;
    }

    // Placeholder for future free spin handling.
    private resolveFreeSpinAction(): boolean {
        return false;
    }
    // Placeholder for future bonus handling.
    private resolveBonusAction(): boolean {
        return false;
    }

    /**
     * Handles dimming non-winning symbols, highlighting the winning ones,
     * and triggering the floating text.
     */
    private startWinCelebration(
        winningDetails: WinningDetail[],
        totalWin: number,
    ): void {
        // 1. Dim all symbols to create visual focus
        this.machine.reels.forEach((reel) =>
            reel.symbols.forEach((symbol) => symbol.setDim(true)),
        );

        // 2. Brighten winning symbols and play their idle loop animations
        winningDetails.forEach((detail) => {
            detail.winningCoords.forEach((pos) => {
                const symbol = this.machine.reels[pos.col].symbols.find(
                    (s) => s.row === pos.row,
                );
                if (symbol) {
                    symbol.setDim(false);
                    symbol.playWinAnimation();
                }
            });
        });

        // 3. Trigger the floating text animation & character animation
        this.winText.showWin(totalWin, () => {
            game.events.emit(GameEvent.UI_WIN_UPDATE, { amount: totalWin });
        });

        game.events.emit(GameEvent.GAME_WIN_UPDATE);
    }

    /**
     * Clears all visual states, stops GSAP tweens, and scales symbols back to default.
     */
    private resetSymbolsVisuals(): void {
        this.machine.reels.forEach((reel) => {
            reel.symbols.forEach((symbol) => {
                symbol.setDim(false);
                symbol.stopWinAnimation();
                gsap.killTweensOf(symbol.scale);
                symbol.scale.set(1);
            });
        });
    }

    /**
     * Triggered when the user clicks spin again before the scheduled stop (Quick Stop).
     */
    public handleQuickStop = (): void => {
        this.clearDelayCall();
        if (!this.currentResponse) return;
        this.machine.stopSpin(this.currentResponse.grid, true);
    };

    /**
     * Natural stop routine called after the GSAP delay concludes.
     */
    private executeStop = (): void => {
        if (!this.currentResponse) return;
        this.machine.stopSpin(this.currentResponse.grid);
    };

    /**
     * Clears the scheduled GSAP delayed call to prevent out-of-sync stops.
     */
    private clearDelayCall(): void {
        if (this.spinDelayCall) {
            this.spinDelayCall.kill();
            this.spinDelayCall = null;
        }
    }

    /**
     * Renders the static outer frame bounding the slot machine grid.
     */
    private setupFrame(): void {
        const panelFrame = new Sprite(Texture.from("slotFrame"));
        panelFrame.scale.set(1.095, 1.2);
        panelFrame.position.set(340, 124);
        this.addChild(panelFrame);
    }

    /**
     * Restricts the visible bounds of symbols so spinning doesn't leak out of the frame.
     */
    private setupMask(container: Container): void {
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
     * Lifecycle destroy method ensuring no active event listeners or timers produce memory leaks.
     */
    public destroy(options?: any): void {
        game.events.off(GameEvent.UI_START_MACHINE, this.startSpin);
        game.events.off(GameEvent.UI_STOP_MACHINE, this.handleQuickStop);
        game.events.off(
            GameEvent.GAME_MACHINE_ANIMATION_STATUS,
            this.onAnimationStatusChange,
        );

        this.clearDelayCall();
        super.destroy(options);
    }
}
