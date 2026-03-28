import { Spine, TrackEntry, Animation } from "@esotericsoftware/spine-pixi-v8";

/**
 * Options for playing Spine animations
 */
export interface PlayOptions {
    loop?: boolean;
    timeScale?: number;
    onStart?: () => void;
    onComplete?: () => void;
    onInterrupt?: () => void;
    onEnd?: () => void;
}

/**
 * SpineManager handles creating, storing, playing, and destroying Spine animations
 */
class SpineManager {
    private spines = new Map<string, Spine>(); // Stores Spine instances by key

    // ---------------- CREATE ----------------

    /**
     * Creates a new Spine instance if not already created
     */
    create(key: string, config: { skeleton: string; atlas: string }): Spine {
        if (this.spines.has(key)) {
            return this.spines.get(key)!;
        }

        // Creates Spine instance from paths (Spine.from expects loaded assets)
        const spine = Spine.from(config);
        spine.state.data.defaultMix = 0.2;

        this.spines.set(key, spine);
        return spine;
    }

    // ---------------- PLAY ----------------

    /**
     * Play an animation on a Spine instance
     */
    play(
        key: string,
        animation: string,
        options: PlayOptions = {},
    ): TrackEntry | undefined {
        const spine = this.spines.get(key);
        if (!spine) return;

        const entry = spine.state.setAnimation(
            0,
            animation,
            options.loop ?? false,
        );

        entry.timeScale = options.timeScale ?? 1;

        entry.listener = {
            start: options.onStart,
            complete: options.onComplete,
            interrupt: options.onInterrupt,
            end: options.onEnd,
        };

        return entry;
    }

    // ---------------- READ ANIMATIONS ----------------

    /**
     * Returns a list of animation names for the given Spine key
     */
    readAnimations(key: string): string[] {
        const spine = this.spines.get(key);
        if (!spine) return [];

        return spine.skeleton.data.animations.map(
            (anim: Animation) => anim.name,
        );
    }

    hasAnimation(key: string, animation: string): boolean {
        const spine = this.spines.get(key);
        if (!spine) return false;

        return spine.skeleton.data.animations.some(
            (anim) => anim.name === animation,
        );
    }

    // ---------------- DESTROY ----------------

    destroy(key: string): void {
        const spine = this.spines.get(key);
        if (!spine) return;

        spine.state.clearTracks();
        spine.removeFromParent();
        spine.destroy({ children: true });

        this.spines.delete(key);
    }

    // ---------------- GET ----------------

    get(key: string): Spine | undefined {
        return this.spines.get(key);
    }
}

// Singleton instance
export const spineManager = new SpineManager();
