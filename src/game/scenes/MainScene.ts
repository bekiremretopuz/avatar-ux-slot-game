import { Container } from "pixi.js";
import { BackgroundAnimations, CharacterAnimations } from "../components";
import { SlotMechanism } from "../components/slot/SlotMechanism";

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
        const background = new BackgroundAnimations();
        const characterAnimations = new CharacterAnimations();
        const slotMechanism = new SlotMechanism();
        this.addChild(background, characterAnimations, slotMechanism);
    }
}
