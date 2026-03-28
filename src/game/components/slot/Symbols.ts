import { Sprite, Texture, BlurFilter } from "pixi.js";

/**
 * Individual Slot Symbol component that handles
 * visual representation and motion blur effects.
 */
export class Symbols extends Sprite {
    /** Vertical blur filter used to simulate high-speed reel movement */
    private readonly _blurFilter = new BlurFilter({
        strengthY: 10,
        strengthX: 0,
        quality: 2,
    });

    constructor(
        private _type: string,
        public readonly row: number,
        public readonly column: number,
    ) {
        /** Initialize sprite with texture based on the symbol type name */
        super(Texture.from(`${_type}.png`));
    }

    /** * Toggles the vertical blur filter.
     * Usually set to true when the reel reaches maximum spinning speed.
     */
    public set isBlurred(value: boolean) {
        this.filters = value ? [this._blurFilter] : [];
    }

    /** Returns the current string identifier of the symbol type */
    public get type(): string {
        return this._type;
    }

    /** * Updates the symbol type and automatically swaps
     * the texture to match the new value.
     */
    public set type(value: string) {
        this._type = value;
        this.texture = Texture.from(`${value}.png`);
    }
}
