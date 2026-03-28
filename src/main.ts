import { Game } from "./Game";
export let game: Game;
(async () => {
    game = new Game();
    game.init();
})();
