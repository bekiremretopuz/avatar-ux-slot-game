import { Sprite, Texture, BlurFilter, Assets, TextStyle, Text } from "pixi.js";
import gsap from "gsap";

/**
 * Slot Symbol component with vertical blur capability and win animations
 */
export class Symbols extends Sprite {
    private static textureCache = new Map<string, Texture>();

    private readonly _blurFilter = new BlurFilter({
        strengthY: 10,
        strengthX: 0,
        quality: 2,
    });

    private winTween: gsap.core.Timeline | null = null;
    private baseTexture: Texture;
    private winTexture: Texture;
    private lineWinText!: Text;

    constructor(
        private _type: string,
        public readonly row: number,
        public readonly column: number,
    ) {
        super(Symbols.getTexture(`${_type}.png`));

        this.anchor.set(0.5);
        this.baseTexture = Symbols.getTexture(`${_type}.png`);
        this.winTexture = this.getWinTexture(_type);
        this.setupWinText();
    }

    private static getTexture(name: string): Texture {
        if (this.textureCache.has(name)) {
            return this.textureCache.get(name)!;
        }
        const texture = Texture.from(name);
        this.textureCache.set(name, texture);
        return texture;
    }

    /** * Checks the asset cache and returns the win texture if available.
     * Falls back to the base texture if no special win visual exists.
     * @param type The symbol identifier string
     */
    private getWinTexture(type: string): Texture {
        const winName = `${type}_connect.png`;

        // Check if the specific win asset is actually loaded in the Pixi cache
        if (Assets.cache.has(winName)) {
            return Texture.from(winName);
        }
        return Texture.from(`${type}.png`);
    }

    private setupWinText(): void {
        const style = new TextStyle({
            fontFamily: "Arial",
            fontSize: 80,
            fontWeight: "bold",
            fill: "#FFD700", // Gold color
            stroke: { color: "#000000", width: 10, join: "round" },
            dropShadow: { alpha: 0.4, blur: 10, color: "#000000", distance: 6 },
        });

        this.lineWinText = new Text({ text: "", style });
        this.lineWinText.anchor.set(0.5);
        this.lineWinText.position.set(0, 0); // Center of the symbol
        this.lineWinText.visible = false;

        this.addChild(this.lineWinText);
    }

    /** * Applies or removes the vertical blur filter based on state
     */
    public set isBlurred(value: boolean) {
        this.filters = value ? [this._blurFilter] : [];
    }

    public get type(): string {
        return this._type;
    }

    /**
     * Updates the symbol type and refreshes its associated textures
     */
    public set type(value: string) {
        this._type = value;
        this.baseTexture = Texture.from(`${value}.png`);
        this.winTexture = this.getWinTexture(value);
        this.texture = this.baseTexture;
    }

    /** * Dims the symbol to emphasize winning paylines
     * @param value True to dim (reduce alpha), False for full visibility
     */
    public setDim(value: boolean) {
        this.alpha = value ? 0.2 : 1;
    }

    /** * Plays the looping win animation sequence with safe texture swapping.
     * Gently scales up and down while flipping between active and inactive textures.
     */
    public playWinAnimation(): void {
        // Check if a dedicated win asset actually exists to prevent useless texture assignments
        const hasSpecial = this.winTexture !== this.baseTexture;

        this.setDim(false);

        if (hasSpecial) this.texture = this.winTexture;

        gsap.timeline()
            .to(this.scale, {
                x: 1.015,
                y: 1.015,
                duration: 0.6,
                ease: "sine.inOut",
            })
            .to(this.scale, {
                x: 1,
                y: 1,
                duration: 0.6,
                ease: "sine.inOut",
                onComplete: () => {
                    if (hasSpecial) this.texture = this.baseTexture;
                },
            });
    }

    public showLineWin(amount: number): void {
        // 1. Update content and reset properties
        this.lineWinText.text = `${amount}`;
        this.lineWinText.alpha = 1;
        this.lineWinText.position.set(0, 0); // Reset to center
        this.lineWinText.visible = true;

        // 2. Kill any active tween on the text to avoid conflicts
        gsap.killTweensOf(this.lineWinText);

        // 3. fade out
        gsap.to(this.lineWinText, {
            alpha: 0,
            duration: 1,
            ease: "power4.in",
            onComplete: () => {
                this.lineWinText.visible = false;
            },
        });
    }

    /** * Stops the running win animation, killing the timeline
     * and resetting the symbol back to its default static visual state.
     */
    public stopWinAnimation() {
        if (this.winTween) {
            this.winTween.kill();
            this.winTween = null;
        }

        this.scale.set(1);
        this.alpha = 1;
        this.texture = this.baseTexture;

        // Hide the floating line text immediately on reset
        this.lineWinText.visible = false;
        gsap.killTweensOf(this.lineWinText);
    }
}
