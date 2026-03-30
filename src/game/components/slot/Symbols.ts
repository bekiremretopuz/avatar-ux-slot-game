import {
    Sprite,
    Texture,
    BlurFilter,
    Assets,
    TextStyle,
    Text,
    Container,
} from "pixi.js";
import gsap from "gsap";

/**
 * Slot Symbol component with vertical blur capability and win animations
 */
export class Symbols extends Container {
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
    private symbolSprite!: Sprite;

    constructor(
        private _type: string,
        public readonly row: number,
        public readonly column: number,
    ) {
        super();

        this.baseTexture = Symbols.getTexture(`${_type}.png`);
        this.winTexture = this.getWinTexture(_type);
        this.setupSprite();
        this.setupWinText();
    }

    private setupSprite(): void {
        this.symbolSprite = new Sprite(this.baseTexture);
        this.symbolSprite.anchor.set(0.5);
        this.addChild(this.symbolSprite);
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
        this.symbolSprite.filters = value ? [this._blurFilter] : [];
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
        this.symbolSprite.texture = this.baseTexture;
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
        const hasSpecial = this.winTexture !== this.baseTexture;

        this.setDim(false);

        if (hasSpecial) this.symbolSprite.texture = this.winTexture;

        gsap.timeline()
            .to(this.symbolSprite.scale, {
                x: 1.015,
                y: 1.015,
                duration: 0.6,
                ease: "sine.inOut",
            })
            .to(this.symbolSprite.scale, {
                x: 1,
                y: 1,
                duration: 0.6,
                ease: "sine.inOut",
                onComplete: () => {
                    if (hasSpecial)
                        this.symbolSprite.texture = this.baseTexture;
                },
            });
    }

    public showLineWin(amount: number): void {
        this.lineWinText.text = `${amount}`;
        this.lineWinText.alpha = 1;
        this.lineWinText.position.set(0, 0); // Reset to center
        this.lineWinText.visible = true;

        gsap.killTweensOf(this.lineWinText);

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

        this.symbolSprite.scale.set(1);
        this.alpha = 1;
        this.symbolSprite.texture = this.baseTexture;

        this.lineWinText.visible = false;
        gsap.killTweensOf(this.lineWinText);
    }
}
