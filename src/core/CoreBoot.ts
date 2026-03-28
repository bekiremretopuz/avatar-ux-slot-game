import { Application, Container, Ticker } from "pixi.js";
import {
    AssetLoader,
    DisplayManager,
    EventContext,
    EventEmitter,
} from "./managers";
import { manifest } from "../game/utils/assetsManifest";

export type SplashScreenConstructor = new () => Container & {
    onProgress: (p: number) => void;
};
export class CoreBoot {
    private app: Application;
    private splashScreen?: InstanceType<SplashScreenConstructor>;
    public events!: EventContext;

    constructor() {
        this.app = new Application();
    }

    public async init(SplashScreenClass: SplashScreenConstructor) {
        await this.app.init({
            background: "#130c0f",
            resizeTo: window,
        });

        const gameContainer = document.getElementById("app");
        if (gameContainer) {
            gameContainer.appendChild(this.app.canvas);
        }

        const emitter = new EventEmitter();
        this.events = new EventContext(emitter);

        new DisplayManager(this.app);

        const loader = new AssetLoader(manifest);
        await loader.load(
            manifest,
            (progress) => {
                console.log(
                    "assets downloading for loadingScreen: [background and logo]",
                    Math.round(progress * 100) + "%",
                );
            },
            ["splash"],
        );

        this.splashScreen = new SplashScreenClass();
        this.app.stage.addChild(this.splashScreen);
        console.log("-----INIT LOADING SCREEN-----");
        await loader.load(
            manifest,
            (progress) => {
                console.log(
                    "all game assets downloading: ",
                    Math.round(progress * 100) + "%",
                );
                this.splashScreen?.onProgress?.(progress);
            },
            ["game"],
        );
    }

    public get ticker(): Ticker {
        return this.app.ticker;
    }
}
