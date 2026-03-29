import { Sprite, Texture, BlurFilter, Assets } from "pixi.js";
import gsap from "gsap";

/**
 * Slot Symbol component with vertical blur capability and win animations
 */
export class Symbols extends Sprite {
    private static textureCache = new Map<string, Texture>();

    // Vertical blur filter applied dynamically during reel spinning
    private readonly _blurFilter = new BlurFilter({
        strengthY: 10,
        strengthX: 0,
        quality: 2,
    });

    private winTween: gsap.core.Timeline | null = null;

    private baseTexture: Texture;
    private winTexture: Texture;

    constructor(
        private _type: string,
        public readonly row: number,
        public readonly column: number,
    ) {
        super(Symbols.getTexture(`${_type}.png`));

        this.anchor.set(0.5);

        this.baseTexture = Symbols.getTexture(`${_type}.png`);
        this.winTexture = this.getWinTexture(_type);
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
    public playWinAnimation() {
        this.stopWinAnimation();

        // Check if a dedicated win asset actually exists to prevent useless texture assignments
        const hasSpecial = this.winTexture !== this.baseTexture;

        this.winTween = gsap.timeline({ repeat: -1 });

        this.winTween.to(this.scale, {
            x: 1.015,
            y: 1.015,
            duration: 0.6,
            ease: "sine.inOut",
            onStart: () => {
                if (hasSpecial) this.texture = this.winTexture;
            },
        });

        this.winTween.to(this.scale, {
            x: 1,
            y: 1,
            duration: 0.6,
            ease: "sine.inOut",
            onStart: () => {
                if (hasSpecial) this.texture = this.baseTexture;
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
    }
}
