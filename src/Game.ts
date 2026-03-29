import { GameDI } from "./game/utils/dependencyContainer";
import {
    BackgroundAnimations,
    CharacterAnimations,
    SlotMechanism,
} from "./game/components";
import { CoreBoot } from "./core/CoreBoot";
import { SplashScreen } from "./game/scenes";
import { EventContext } from "./core";

export class Game {
    private coreBoot!: CoreBoot;
    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        this.coreBoot = new CoreBoot();

        await this.coreBoot.init(SplashScreen);
        this.addDependency();
    }

    addDependency() {
        GameDI.add(BackgroundAnimations);
        GameDI.add(CharacterAnimations);
        GameDI.add(SlotMechanism);
        GameDI.boot();
    }

    // Event bubble
    public get events(): EventContext {
        return this.coreBoot.events;
    }
}
