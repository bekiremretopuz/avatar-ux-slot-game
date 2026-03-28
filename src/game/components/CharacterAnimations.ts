import { Container } from "pixi.js";
import { SpinePrefab } from "../../core";

export enum CharacterAnimation {
    BONUS_ANTICIPATION = "character_bonus_anticipation",
    BONUS_ANTICIPATION_LOSE = "character_bonus_anticipation_lose",
    BONUS_ANTICIPATION_WIN = "character_bonus_anticipation_win",
    IDLE = "character_idle",
    SMALL_WIN = "character_small_win",
    WILD_LANDING = "character_wild_landing",
    WILD_THROW = "character_wild_throw",
}

/**
 * Manages character-specific Spine animations and transitions.
 */
export class CharacterAnimations extends Container {
    private readonly spine: SpinePrefab;

    constructor() {
        super();

        this.spine = new SpinePrefab({
            key: "characterAnimation",
            atlas: "characterAtlas",
            skeleton: "characterSkel",
            scale: { x: 0.58, y: 0.58 },
            position: { x: 175, y: 623 },
        });

        this.setupTransitions();

        this.spine.setPivotAlign("center", "center");
        this.spine.play(CharacterAnimation.IDLE, { loop: true });

        this.addChild(this.spine);
    }

    /**
     * Configures smooth transitions between animation states.
     */
    private setupTransitions(): void {
        const { stateData } = this.spine;

        stateData.defaultMix = 0.2;
        stateData.setMix(
            CharacterAnimation.IDLE,
            CharacterAnimation.SMALL_WIN,
            0.1,
        );
    }

    /**
     * Plays a specific character animation.
     */
    public play(animation: CharacterAnimation, loop: boolean = true): void {
        this.spine.play(animation, { loop });
    }
}
