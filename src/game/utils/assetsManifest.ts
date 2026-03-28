import { AssetsManifest } from "pixi.js";

export const manifest: AssetsManifest = {
    bundles: [
        {
            name: "splash",
            assets: {
                splashScreenBgAtlas: "assets/images/splash_screen_bg.json",
                splashScreenAtlas: "assets/images/splash_screen.json",
            },
        },
        {
            name: "game",
            assets: {
                slotFrame: "assets/images/slot_frame.png",
                gameBackgroundAtlas: "assets/images/background_atlas.json",
                hudAtlas: "assets/images/hud.json",
                symbolAtlas: "assets/images/symbol_atlas.json",
                characterSkel: "assets/spines/character/character.json",
                characterAtlas: "assets/spines/character/character.atlas",
            },
        },
    ],
};
