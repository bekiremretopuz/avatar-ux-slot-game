import { Container, Sprite, Text, Texture, DestroyOptions } from "pixi.js";
import { gsap } from "gsap";
import { GAME_WIDTH } from "../../core/managers/DisplayManager";

const CONFIG = {
    CLOUD_COUNT: 6,
    BASE_Y: 150,
    DURATION: 270,
    OFFSET_X: 200,
    FADE_IN: 0.4,
    FADE_OUT: 0.1,
};

/**
 * Manages static background elements and parallax cloud animations.
 */
export class BackgroundAnimations extends Container {
    private readonly clouds: Sprite[] = [];
    private readonly assets = [
        "multiplier_counter_cloud1.png",
        "multiplier_counter_cloud2.png",
        "multiplier_counter_cloud3.png",
    ];

    public postConstruct(): void {
        this.initStaticLayers();
        this.initUI();
        this.initClouds();
        this.initLogo();
    }

    private initStaticLayers(): void {
        this.addChild(new Sprite(Texture.from("bg_landscape_basegame.jpg")));
    }

    private initUI(): void {
        this.createMultiplierUI();
        this.createWaysSign();
    }

    private initLogo(): void {
        const logo = new Sprite(Texture.from("logo_game_small.png"));
        logo.position.set(1383, 40);
        this.addChild(logo);
    }

    private createMultiplierUI(): void {
        const moon = new Container();
        const moonBg = new Sprite(Texture.from("multiplier_counter_moon.png"));

        // Setup symbols with shorthand scaling
        const sign = new Sprite(Texture.from("number_multiplier_x.png"));
        const amount = new Sprite(Texture.from("number_multiplier_2.png"));
        [sign, amount].forEach((s) => s.scale.set(0.35));

        sign.position.set(43, 80);
        amount.position.set(130, 80);

        moon.addChild(moonBg, sign, amount);
        moon.position.set(0, 10);
        this.addChild(moon);
    }

    private createWaysSign(): void {
        const container = new Container();
        const sign = new Sprite(Texture.from("counter_ways.png"));
        sign.position.set(1388, 290);

        const text = new Text({
            text: "243",
            style: {
                fontSize: 52,
                fill: 0xffffff,
                fontWeight: "bold",
                letterSpacing: 6,
            },
        });
        text.anchor.set(0.5);
        text.position.set(
            sign.x + sign.width / 2,
            sign.y + sign.height / 2 - 10,
        );

        container.addChild(sign, text);
        this.addChild(container);
    }

    private initClouds(): void {
        for (let i = 0; i < CONFIG.CLOUD_COUNT; i++) {
            const layer = i % 3; // 0: Far, 1: Mid, 2: Near
            const cloud = new Sprite(
                Texture.from(this.assets[i % this.assets.length]),
            );

            cloud.anchor.set(0.5);
            cloud.y = CONFIG.BASE_Y;
            cloud.alpha = 0;
            cloud.scale.set(0.6 + layer * 0.2);

            const duration = CONFIG.DURATION - layer * 60 + Math.random() * 10;

            this.clouds.push(cloud);
            this.addChild(cloud);
            this.animateCloud(cloud, duration, i / CONFIG.CLOUD_COUNT);
        }
    }

    private animateCloud(
        cloud: Sprite,
        duration: number,
        progress: number,
    ): void {
        const startX = -cloud.width - CONFIG.OFFSET_X;
        const endX = GAME_WIDTH + cloud.width;

        const tl = gsap.timeline({ repeat: -1 });

        // Horizontal movement & Fades
        tl.fromTo(cloud, { x: startX }, { x: endX, duration, ease: "none" }, 0)
            .to(
                cloud,
                {
                    alpha: 1,
                    duration: duration * CONFIG.FADE_IN,
                    ease: "power1.in",
                },
                0,
            )
            .to(
                cloud,
                {
                    alpha: 0,
                    duration: duration * CONFIG.FADE_OUT,
                    ease: "power2.in",
                },
                duration * (1 - CONFIG.FADE_OUT),
            );

        tl.progress(progress);
    }

    public override destroy(options?: DestroyOptions): void {
        this.clouds.forEach((c) => gsap.killTweensOf(c));
        super.destroy(options);
    }
}
