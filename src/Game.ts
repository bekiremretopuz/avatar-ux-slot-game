import { Ticker } from "pixi.js";
import { CoreBoot } from "./core/CoreBoot";
import { SplashScreen } from "./game/scenes/SplashScreen";
import { EventContext } from "./core/managers/EventManager";

export class Game {
    private coreBoot!: CoreBoot;
    constructor() {
        this.coreBoot = new CoreBoot();
    }

    public init(): void {
        this.coreBoot.init(SplashScreen);
    }

    public ticker(): Ticker {
        return this.coreBoot.ticker;
    }

    public get events(): EventContext {
        return this.coreBoot.events;
    }
}
