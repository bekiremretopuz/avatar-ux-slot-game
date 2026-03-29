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

    /**
     * Plays an animation and optionally queues the next one (e.g., back to IDLE)
     * * @param animation The primary animation to play.
     * @param options Standard Spine play options (loop, speed etc.).
     * @param queueAnimation Optional animation to play immediately after the first one completes.
     */
    play(animation: string, options?: PlayOptions, queueAnimation?: string) {
        const trackEntry = spineManager.play(this.key, animation, options);

        if (queueAnimation) {
            this.spine.state.addAnimation(0, queueAnimation, true, 0);
        }

        return trackEntry;
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
