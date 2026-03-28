import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
    base: "./",
    build: {
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules/gsap")) {
                        return "gsap";
                    }
                    if (id.includes("node_modules")) {
                        return "game-engine";
                    }
                },
                chunkFileNames: "assets/js/[name]-[hash].js",
                entryFileNames: "assets/js/[name]-[hash].js",
                assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
            },
        },
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: "assets/*", // copy from root assets
                    dest: "assets", // to dist/assets
                },
            ],
        }),
    ],
});
