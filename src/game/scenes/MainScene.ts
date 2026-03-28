import { Container } from "pixi.js";
import { BackgroundAnimations, CharacterAnimations } from "../components";
import { SlotMechanism } from "../components/slot/SlotMechanism";
import { game } from "../../main";
import { GameEvent } from "../../core";

/**
 * MainScene represents the main menu / splash screen of the game.
 * Includes:
 * - Background image
 * - Slot Mechanism
 * - Animated character
 */
export class MainScene extends Container {
    constructor() {
        super();
        game.events.emit(GameEvent.SHOW_MAIN_SCREEN);
        const background = new BackgroundAnimations();
        const characterAnimations = new CharacterAnimations();
        const slotMechanism = new SlotMechanism();
        this.addChild(background, characterAnimations, slotMechanism);
    }
}
