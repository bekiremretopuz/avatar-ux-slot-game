import { Container, PointData, DestroyOptions } from "pixi.js";
import { Spine } from "@esotericsoftware/spine-pixi-v8";
import { spineManager } from "../managers";
import { PlayOptions } from "../managers/SpineManager";

export interface GameAnimationsOptions {
    skeleton: string;
    atlas: string;
    key: string;
    position?: PointData;
    scale?: PointData;
}

export type HorizontalAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "center" | "bottom";

export class SpinePrefab extends Container {
    private readonly spine: Spine;
    private readonly key: string;

    constructor({
        skeleton,
        atlas,
        key,
        position,
        scale,
    }: GameAnimationsOptions) {
        super();
        this.key = key;
        this.spine = spineManager.create(key, { skeleton, atlas });

        this.addChild(this.spine);
        if (position) this.position.copyFrom(position);
        if (scale) this.spine.scale.copyFrom(scale);
    }

    play(animation: string, options?: PlayOptions) {
        return spineManager.play(this.key, animation, options);
    }

    setPivotAlign(
        h: HorizontalAlign = "center",
        v: VerticalAlign = "center",
    ): void {
        const { x, y, width, height } = this.getLocalBounds();
        const px = x + (h === "center" ? width / 2 : h === "right" ? width : 0);
        const py =
            y + (v === "center" ? height / 2 : v === "bottom" ? height : 0);
        this.pivot.set(px, py);
    }

    /** Cleanup manager references on destroy */
    override destroy(options?: DestroyOptions): void {
        spineManager.destroy(this.key);
        super.destroy(options);
    }

    // Getters
    get stateData() {
        return this.spine.state.data;
    }
}
