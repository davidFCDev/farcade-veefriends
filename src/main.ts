import { initRemix } from "@insidethesim/remix-dev";
import GameSettings from "./config/GameSettings";
import { AlbumScene } from "./scenes/AlbumScene";
import { GameScene } from "./scenes/GameScene";
import { MainScene } from "./scenes/MainScene";
import { PreloadScene } from "./scenes/PreloadScene";
import GameStateManager from "./utils/GameStateManager";

// SDK mock is automatically initialized by the framework (dev-init.ts)

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: GameSettings.canvas.width,
  height: GameSettings.canvas.height,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: document.body,
    width: GameSettings.canvas.width,
    height: GameSettings.canvas.height,
  },
  backgroundColor: "#1a1a1a",
  scene: [PreloadScene, MainScene, GameScene, AlbumScene],
  physics: {
    default: "arcade",
  },
  fps: {
    target: 60,
  },
  pixelArt: false,
  antialias: true,
};

// Create the game instance
const game = new Phaser.Game(config);

// Store globally for performance monitoring and HMR cleanup
(window as any).game = game;

// Initialize Remix framework after game is created
game.events.once("ready", async () => {
  initRemix(game, {
    multiplayer: false,
  });

  // Call SDK ready when game is fully loaded and initialize game state
  if (typeof window !== "undefined" && (window as any).FarcadeSDK) {
    try {
      const gameInfo = await (
        window as any
      ).FarcadeSDK.singlePlayer.actions.ready();
      console.log("Farcade SDK: Game ready", gameInfo);

      // Initialize game state from SDK
      const stateManager = GameStateManager.getInstance();
      stateManager.initializeFromSDK(gameInfo.initialGameState);
    } catch (error) {
      console.error("Error calling SDK ready:", error);
    }
  }
});

// Handle play_again event from SDK
if (typeof window !== "undefined" && (window as any).FarcadeSDK) {
  (window as any).FarcadeSDK.on("play_again", () => {
    console.log("Farcade SDK: Play again requested");
    // Restart the game
    const currentScene = game.scene.getScenes(true)[0];
    if (currentScene) {
      game.scene.stop(currentScene.scene.key);
      game.scene.start("PreloadScene");
    }
  });

  // Handle toggle_mute event from SDK
  (window as any).FarcadeSDK.on("toggle_mute", (data: { isMuted: boolean }) => {
    console.log("Farcade SDK: Toggle mute", data.isMuted);
    game.sound.mute = data.isMuted;
  });
}
