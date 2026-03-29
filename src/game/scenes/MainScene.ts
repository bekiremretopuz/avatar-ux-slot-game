// game/scenes/MainScene.ts
import { Container } from "pixi.js";
import {
    SlotMechanism,
    CharacterAnimations,
    BackgroundAnimations,
} from "../components";
import { Inject } from "../utils/dependencyContainer";

export class MainScene extends Container {
    @Inject(BackgroundAnimations)
    private _background!: BackgroundAnimations;

    @Inject(CharacterAnimations)
    private _character!: CharacterAnimations;

    @Inject(SlotMechanism)
    private _slotMechanism!: SlotMechanism;

    constructor() {
        super();
        this.init();
    }

    private init() {
        this.addChild(this._background, this._slotMechanism, this._character);
    }
}
