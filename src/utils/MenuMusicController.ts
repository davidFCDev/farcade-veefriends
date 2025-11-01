import Phaser from "phaser";

export default class MenuMusicController {
  private static music?: Phaser.Sound.BaseSound;

  static play(scene: Phaser.Scene) {
    if (!scene.cache?.audio?.exists("bgm-menu")) {
      return;
    }

    const manager = scene.sound;
    const existing = MenuMusicController.music ?? manager.get("bgm-menu");

    if (existing && existing.isPlaying) {
      MenuMusicController.music = existing;
      return;
    }

    const music =
      existing ??
      manager.add("bgm-menu", {
        loop: true,
        volume: 0.12,
      });

    MenuMusicController.music = music;

    if (music && !music.isPlaying) {
      try {
        music.play();
      } catch (error) {
        console.warn("Failed to play menu music:", error);
        MenuMusicController.music = undefined;
      }
    }
  }

  static stop(scene: Phaser.Scene) {
    const manager = scene.sound;
    const music = MenuMusicController.music ?? manager.get("bgm-menu");

    if (!music) {
      return;
    }

    try {
      if (music.isPlaying) {
        music.stop();
      }
    } catch (error) {
      console.warn("Failed to stop menu music:", error);
    }

    MenuMusicController.music = undefined;
  }
}
