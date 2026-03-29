import { Container, Text, TextStyle } from "pixi.js";
import gsap from "gsap";

export class FloatingWinText extends Container {
    private _textObj: Text;
    private _displayValue = { val: 0 }; // Used as a proxy for GSAP number counting animation
    private _timeline: gsap.core.Timeline | null = null;

    constructor() {
        super();

        const style = new TextStyle({
            fontSize: 150,
            fill: "#FFCC00",
            stroke: { color: "#000000", width: 10, join: "round" },
            dropShadow: { alpha: 0.4, blur: 10, color: "#000000", distance: 6 },
            align: "center",
        });

        this._textObj = new Text({ text: "", style });
        this._textObj.anchor.set(0.5);
        this.addChild(this._textObj);
        this.visible = false;
    }

    /**
     * Triggers the floating text animation for wins.
     * Counts up the text and drops it down to the UI bar.
     * * @param amount The total win amount to be displayed
     * @param onHit Callback function triggered when the text hits the UI bar
     */
    public showWin(amount: number, onHit?: () => void): void {
        // Safety check: Instantly complete the previous animation if it's still running
        this.stopAndComplete();

        this.visible = true;
        this.alpha = 1;
        this.y = 462; // Starting Y position
        this._displayValue.val = 0;
        this._textObj.text = "";

        this._timeline = gsap.timeline({
            onComplete: () => {
                this.visible = false;
            },
        });

        this._timeline
            // 1. Number counting effect
            .to(this._displayValue, {
                val: amount,
                duration: 0.8,
                ease: "power2.out",
                onUpdate: () => {
                    this._textObj.text = `${Math.floor(this._displayValue.val)}`;
                },
            })
            // 2. Drop down and fade out effect after a 0.3s delay
            .to(
                this,
                {
                    y: 880, // Target Y position (near the UI bar)
                    alpha: 0,
                    duration: 0.7,
                    ease: "power2.in",
                },
                "+=0.3",
            );

        // 3. Add the onHit callback to the timeline slightly before the drop finishes
        if (onHit) {
            this._timeline.add(onHit, "-=0.1");
        }
    }

    /**
     * Called when a new spin is initiated.
     * If the winning text is still animating, it fast-forwards it to the end
     * to guarantee that the balance update callback (onHit) is fired.
     */
    public stopAndComplete(): void {
        if (this._timeline) {
            // Force the timeline to its final state (triggers onHit and onComplete synchronously)
            this._timeline.progress(1);
            this._timeline.kill();
            this._timeline = null;
        }
        this.visible = false;
    }
}
