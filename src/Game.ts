import { CoreBoot } from "./core/CoreBoot";
import { SplashScreen } from "./game/scenes/SplashScreen";
import { EventContext } from "./core/managers/EventManager";

export class Game {
    private coreBoot!: CoreBoot;
    constructor() {
        this.coreBoot = new CoreBoot();
        this.coreBoot.init(SplashScreen);
    }

    // Event bubble
    public get events(): EventContext {
        return this.coreBoot.events;
    }
}
