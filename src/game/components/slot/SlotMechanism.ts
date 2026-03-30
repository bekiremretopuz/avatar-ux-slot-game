import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { Machine, MACHINE_EVENTS } from "./Machine";
import { GAME_CONFIG, REEL_CONFIGS } from "../../misc/const";
import { game } from "../../../main";
import { GameEvent } from "../../../core";
import { SlotMath, SpinResult, WinningDetail } from "../../misc/spinMath";
import { gsap } from "gsap";
import { FloatingWinText } from "../FloatingText";
import { Symbols } from "./Symbols";

export class SlotMechanism extends Container {
    private machine!: Machine;
    private currentResponse: SpinResult | null = null;
    private spinResponseDelayedCall: gsap.core.Animation | null = null;
    private winText!: FloatingWinText;
    private winLoopDelayedCall: gsap.core.Animation | null = null;

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
        this.currentResponse = SlotMath.spin(GAME_CONFIG.FIXED_BET_AMOUNT);
        console.log("Spin Response: ", this.currentResponse);
        this.machine.startSpin();
        this.spinResponseDelayedCall = gsap.delayedCall(0.6, this.executeStop);
    };

    private onAnimationStatusChange = async (data: {
        status: string;
    }): Promise<void> => {
        if (data.status === MACHINE_EVENTS.COMPLETE) {
            await this.resolveNextAction();
        }
    };

    /**
     * Resolves the next outcome in priority order: win first, then free spins, then bonus.
     */
    private async resolveNextAction(): Promise<boolean> {
        return (
            (await this.resolveWinAction()) ||
            (await this.resolveFreeSpinAction()) ||
            (await this.resolveBonusAction())
        );
    }

    private async resolveWinAction(): Promise<boolean> {
        const response = this.currentResponse;
        if (!response || response.totalWin <= 0 || !response.winningDetails) {
            return false;
        }

        this.startWinCelebration(response.winningDetails, response.totalWin);
        return true;
    }

    private async resolveFreeSpinAction(): Promise<boolean> {
        return false;
    }
    private async resolveBonusAction(): Promise<boolean> {
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
        // Kill previous active loop to prevent overlapping calls
        if (this.winLoopDelayedCall) this.winLoopDelayedCall.kill();

        let index = 0;

        const lineCount = winningDetails.length;
        // Map to keep track of how many times each payline has been displayed
        const lineRepeatCount = new Map<number, number>();
        winningDetails.forEach((_, i) => lineRepeatCount.set(i, 0));

        const runLoop = () => {
            // Loop back to the first winning line if we reach the end
            if (index >= winningDetails.length) index = 0;

            // 1. Dim all symbols to create visual focus
            this.machine.reels.forEach((r) =>
                r.symbols.forEach((s) => s.setDim(true)),
            );

            const currentCoords = winningDetails[index].winningCoords;
            const symbolsInLine: Symbols[] = [];

            // 2. Brighten winning symbols and play their idle loop animations
            currentCoords.forEach((pos) => {
                const symbol = this.machine.reels[pos.col].symbols.find(
                    (s) => s.row === pos.row,
                );
                if (symbol) {
                    const s = symbol as Symbols;
                    s.playWinAnimation();
                    symbolsInLine.push(s);
                }
            });

            // Increment the display count for the current line
            const currentCount = lineRepeatCount.get(index) || 0;
            const newCount = currentCount + 1;
            lineRepeatCount.set(index, newCount);

            // Condition 1: There must be more than 1 winning line in total.
            // Condition 2: This specific line must be showing at least for the 2nd time (skip on 1st loop).
            const shouldShowText = lineCount > 1 && newCount >= 2;

            if (shouldShowText) {
                // Find the visually central symbol of the winning payline
                const middleIndex = Math.floor(symbolsInLine.length / 2);
                const middleSymbol = symbolsInLine[middleIndex];

                if (middleSymbol) {
                    // Trigger floating text animation directly on the symbol
                    middleSymbol.showLineWin(winningDetails[index].amount);
                }
            }

            index++;
            // Schedule the next line evaluation after exactly 1.5 seconds
            this.winLoopDelayedCall = gsap.delayedCall(1.5, runLoop);
        };

        runLoop();

        // 3. Trigger the floating text animation & character animation
        game.events.emit(GameEvent.GAME_WIN_UPDATE);
        this.winText.showWin(totalWin, () => {
            game.events.emit(GameEvent.UI_WIN_UPDATE, { amount: totalWin });
        });
    }

    /**
     * Clears all visual states, stops GSAP tweens, and scales symbols back to default.
     */
    private resetSymbolsVisuals(): void {
        if (this.winLoopDelayedCall) {
            this.winLoopDelayedCall.kill();
            this.winLoopDelayedCall = null;
        }

        this.machine.reels.forEach((reel) => {
            reel.symbols.forEach((symbol) => {
                symbol.stopWinAnimation();
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
        if (this.spinResponseDelayedCall) {
            this.spinResponseDelayedCall.kill();
            this.spinResponseDelayedCall = null;
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
        if (this.winLoopDelayedCall) this.winLoopDelayedCall.kill();
        super.destroy(options);
    }
}
