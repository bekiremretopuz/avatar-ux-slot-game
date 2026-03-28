import { Assets, Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import gsap from "gsap";
import { GAME_HEIGHT, GAME_WIDTH } from "../../core/managers/DisplayManager";
import { MainScene } from "./MainScene";
import { GAME_CONFIG } from "../misc/const";

/**
 * Handles the game's entry point: asset loading, splash UI, and transition to gameplay.
 */
export class SplashScreen extends Container {
    private progressBarWrapper!: Container;
    private progressBarFill!: Graphics;
    private continueLabel!: Text;
    private isComplete = false;

    private readonly PROGRESS_WIDTH = 600;
    private readonly PROGRESS_HEIGHT = 15;

    constructor() {
        super();
        this.buildLayout();
    }

    private buildLayout(): void {
        // Base background
        this.addChild(new Sprite(Texture.from("splash_bg_landscape.jpg")));

        const uiWrapper = new Container();
        this.addChild(uiWrapper);

        // Branding
        this.addLogos(uiWrapper);

        // Game details & Multiplier
        this.addInfoSection(uiWrapper);

        // Feature highlight boxes
        this.initFeatures(uiWrapper);

        // Loading and interaction elements
        this.initProgressBar(uiWrapper);
        this.continueLabel = this.createContinueLabel(uiWrapper);
    }

    private addLogos(parent: Container): void {
        const companyLogo = new Sprite(
            Texture.from("splash_logo_avatarux.png"),
        );
        companyLogo.anchor.set(0.5);
        companyLogo.position.set(GAME_WIDTH - companyLogo.width * 0.5, 72);

        const gameLogo = new Sprite(Texture.from("splash_game_logo.png"));
        gameLogo.anchor.set(0.5);
        gameLogo.scale.set(1.1);
        gameLogo.position.set(560, 253);

        parent.addChild(companyLogo, gameLogo);
    }

    private addInfoSection(parent: Container): void {
        const winText = new Text({
            text: "WIN UP TO 10000X THE BET!",
            style: {
                fontSize: 36,
                fill: 0xffffff,
                fontWeight: "bold",
                align: "center",
            },
        });
        winText.position.set(876, 275);

        // Stylized multiplier using your specific spacing rules
        const multiplier = this.createMultiplier("10000x", {
            digitSpacing: -20,
            groupSpacing: 30,
            xSpacing: 20,
        });
        multiplier.position.set(1184, 160);

        const volatility = new Sprite(Texture.from("splash_volatility.png"));
        volatility.anchor.set(0.5);
        volatility.position.set(1021, 373);

        parent.addChild(winText, multiplier, volatility);
    }

    private initFeatures(parent: Container): void {
        const container = new Container();
        const featuresData: [string, string][] = [
            ["splash_feature_1.png", "PopWins™"],
            ["splash_feature_2.png", "3+ BONUS SYMBOLS UNLOCK FREE SPINS!"],
            ["splash_feature_3.png", "GAMBLE WHEEL!"],
        ];

        featuresData.forEach((data, index) => {
            const box = this.createFeatureBox(data[0], data[1]);
            box.x = (index - 1) * 550; // Center offset logic
            container.addChild(box);
        });

        container.position.set(GAME_WIDTH * 0.5, 688);
        parent.addChild(container);
    }

    private initProgressBar(parent: Container): void {
        this.progressBarWrapper = new Container();
        this.progressBarWrapper.position.set(
            GAME_WIDTH * 0.5,
            GAME_HEIGHT - 40,
        );

        const bg = new Graphics()
            .roundRect(
                -this.PROGRESS_WIDTH / 2,
                -this.PROGRESS_HEIGHT / 2,
                this.PROGRESS_WIDTH,
                this.PROGRESS_HEIGHT,
                10,
            )
            .fill("#ffffff");

        this.progressBarFill = new Graphics();
        this.progressBarWrapper.addChild(bg, this.progressBarFill);
        parent.addChild(this.progressBarWrapper);
    }

    /**
     * Updates loading bar and triggers completion when progress hits 100%.
     */
    public onProgress(progress: number): void {
        if (this.isComplete) return;

        const value = Math.min(Math.max(progress, 0), 1);
        this.progressBarFill
            .clear()
            .roundRect(
                -this.PROGRESS_WIDTH / 2,
                -this.PROGRESS_HEIGHT / 2,
                this.PROGRESS_WIDTH * value,
                this.PROGRESS_HEIGHT,
                10,
            )
            .fill("#1b191952");

        if (value >= 1) {
            this.isComplete = true;
            this.handleComplete();
        }
    }

    private handleComplete(): void {
        // Apply remote config to local game settings
        const config = Assets.get("gameConfig");
        if (config) {
            Object.assign(GAME_CONFIG, {
                INITIAL_CREDITS: config.initialCredits,
                FIXED_BET_AMOUNT: config.fixedBetAmount,
                LOCALES: config.numberFormat.locales,
                CURRENCY: config.numberFormat.currency,
            });
        }

        this.progressBarWrapper.visible = false;
        this.continueLabel.visible = true;

        // Interaction setup
        this.eventMode = "static";
        this.cursor = "pointer";
        this.once("pointerdown", this.startTransition);

        // Subtle blink to prompt user action
        gsap.to(this.continueLabel, {
            alpha: 0,
            duration: 0.8,
            ease: "power1.inOut",
            repeat: -1,
            yoyo: true,
        });
    }

    private startTransition(): void {
        if (!this.parent) return;
        gsap.killTweensOf(this.continueLabel);

        const mainScene = new MainScene();
        mainScene.alpha = 0;
        this.parent.addChild(mainScene);

        // Simple cross-fade between splash and gameplay
        gsap.timeline({ onComplete: () => this.destroy({ children: true }) })
            .to(this, { alpha: 0, duration: 0.6, ease: "power2.out" }, 0)
            .to(mainScene, { alpha: 1, duration: 0.6, ease: "power2.out" }, 0);
    }

    /**
     * Helper to build the multiplier display with character-specific spacing.
     */
    private createMultiplier(value: string, options?: any): Container {
        const {
            digitSpacing = 15,
            groupSpacing = 5,
            xSpacing = 10,
        } = options || {};
        const container = new Container();
        let x = 0;
        let digitCount = 0;

        for (let i = 0; i < value.length; i++) {
            const char = value[i];
            const isX = char.toLowerCase() === "x";
            const tex = isX
                ? "splash_number_x.png"
                : `splash_number_${char}.png`;

            const sprite = new Sprite(Texture.from(tex));
            sprite.scale.set(0.67);
            sprite.anchor.set(0.5);
            sprite.x = x + sprite.width / 2;
            container.addChild(sprite);

            if (/\d/.test(char)) {
                digitCount++;
                x += sprite.width + digitSpacing;
                if (digitCount === 2) x += groupSpacing;
            } else {
                x += sprite.width + xSpacing;
            }
        }
        container.pivot.x = x / 2;
        return container;
    }

    private createFeatureBox(tex: string, label: string): Container {
        const container = new Container();
        const bg = new Sprite(Texture.from("splash_box.png"));
        bg.anchor.set(0.5);
        bg.scale.set(0.62);

        const feat = new Sprite(Texture.from(tex));
        feat.anchor.set(0.5);
        feat.scale.set(0.59);
        feat.y = -40;

        const txt = new Text({
            text: label,
            style: {
                fontSize: 30,
                fill: 0xffffff,
                fontWeight: "bold",
                wordWrap: true,
                wordWrapWidth: 330,
            },
        });
        txt.anchor.set(0.5);
        txt.y = bg.height * 0.35;

        container.addChild(bg, feat, txt);
        return container;
    }

    private createContinueLabel(parent: Container): Text {
        const label = new Text({
            text: "CLICK ANYWHERE TO PLAY",
            style: { fontSize: 32, fill: 0xffffff, align: "center" },
        });
        label.anchor.set(0.5);
        label.position.set(GAME_WIDTH * 0.5, 906);
        label.visible = false;
        parent.addChild(label);
        return label;
    }
}
