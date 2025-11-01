import GameSettings from "../config/GameSettings";
import MenuMusicController from "../utils/MenuMusicController";
import { GameScene } from "./GameScene";

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    // Load WebFont for Chicle
    this.load.script(
      "webfont",
      "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
    );

    // Load main page background (WebP for faster loading)
    this.load.image(
      "main-background",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/fondo-menu-vQS6CJPtxGbp0RddLKY1Wjk0p3Ya46.webp"
    );

    this.load.audio(
      "sfx-button",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/button-glDsBe370knE7WctxtYObJCunwLy2N.mp3?3wMr"
    );
    this.load.audio(
      "bgm-menu",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/main-song-PcbJRVFBNYAiEXs0hmOdFb2GWzD7X9.mp3?rwJn"
    );
  }

  create() {
    // Load Google Font Chicle before creating UI
    (window as any).WebFont.load({
      google: {
        families: ["Chicle"],
      },
      active: () => {
        this.initializeMainScene();
      },
    });
  }

  private initializeMainScene() {
    const { width, height } = GameSettings.canvas;

    GameScene.stopGlobalLevelMusic(this.sound);
    MenuMusicController.play(this);

    // Create background image with adaptive scaling
    this.createAdaptiveBackground();

    // Title text - "Where is the VeeFriend?" at the top (White with black stroke)
    const titleY = 200; // Position from top
    const titleText = this.add.text(
      width / 2,
      titleY,
      "WHERE IS THE\nVEEFRIEND?",
      {
        fontSize: "88px", // Reduced from 96px to prevent cutoff with thick border
        color: "#FFFFFF", // White color
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        align: "center",
        stroke: "#000000", // Black border
        strokeThickness: 10, // Border thickness
        wordWrap: { width: width - 40 }, // Maximum width to prevent cutoff
        shadow: {
          offsetX: 6,
          offsetY: 10,
          color: "#000000",
          blur: 0, // No blur for opaque shadow
          fill: true,
        },
      }
    );
    titleText.setOrigin(0.5);
    titleText.setPadding(40, 20, 40, 0); // Extra padding prevents left-side clipping

    // Play button in the center
    this.createPlayButton();

    // Album button below Play button
    this.createAlbumButton();

    // Shop button below Album button
    this.createShopButton();
  }

  private playButtonSound() {
    if (!this.cache?.audio?.exists("sfx-button")) {
      return;
    }

    this.sound.play("sfx-button", { volume: 0.55 });
  }

  private createAdaptiveBackground() {
    const { width, height } = GameSettings.canvas;

    // Add background image
    const background = this.add.image(width / 2, height / 2, "main-background");

    // Calculate scale to cover the entire canvas without stretching
    // (like CSS object-fit: cover)
    const scaleX = width / background.width;
    const scaleY = height / background.height;

    // Use the larger scale to ensure it covers everything
    // This might crop some parts but won't stretch
    const scale = Math.max(scaleX, scaleY);

    background.setScale(scale);
    background.setDepth(0);
  }

  private createPlayButton() {
    const { width, height } = GameSettings.canvas;

    const buttonWidth = 320;
    const buttonHeight = 90;
    const buttonX = width / 2;
    const buttonY = height / 2; // Centered vertically (adjusted to prevent text cutoff)
    const shadowOffset = 8;

    // Create button graphics
    const buttonBg = this.add.graphics();

    // Black shadow (right and bottom)
    buttonBg.fillStyle(0x000000, 1);
    buttonBg.fillRoundedRect(
      buttonX - buttonWidth / 2 + shadowOffset,
      buttonY - buttonHeight / 2 + shadowOffset,
      buttonWidth,
      buttonHeight,
      20
    );

    // Black border - same thickness as header (8px)
    buttonBg.lineStyle(8, 0x000000, 1);
    buttonBg.strokeRoundedRect(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      20
    );

    // Yellow background (VeeFriends yellow)
    buttonBg.fillStyle(0xf7ea48, 1);
    buttonBg.fillRoundedRect(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      20
    );

    // Button text - White with thick black border
    const buttonText = this.add.text(buttonX, buttonY, "PLAY", {
      fontSize: "44px", // Reduced from 48px to prevent cutoff with thick border
      color: "#FFFFFF", // White
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000", // Black border
      strokeThickness: 8, // Thick border for visibility
      wordWrap: { width: buttonWidth - 30 }, // Prevent text cutoff with more padding
    });
    buttonText.setOrigin(0.5);

    // Create interactive zone for the entire button
    const buttonZone = this.add.zone(
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight
    );
    buttonZone.setInteractive();

    // Cursor change on hover
    buttonZone.on("pointerover", () => {
      this.input.setDefaultCursor("pointer");
    });

    buttonZone.on("pointerout", () => {
      this.input.setDefaultCursor("default");
    });

    // Click handler - Start game
    buttonZone.on("pointerdown", () => {
      this.playButtonSound();
      // Show instructions modal before starting the game
      this.showInstructionsModal();
    });
  }

  private createAlbumButton() {
    const { width, height } = GameSettings.canvas;

    const buttonWidth = 320;
    const buttonHeight = 90;
    const buttonX = width / 2;
    const buttonY = height / 2 + 120; // Below the PLAY button
    const shadowOffset = 8;

    // Create button graphics
    const buttonBg = this.add.graphics();

    // Black shadow (right and bottom)
    buttonBg.fillStyle(0x000000, 1);
    buttonBg.fillRoundedRect(
      buttonX - buttonWidth / 2 + shadowOffset,
      buttonY - buttonHeight / 2 + shadowOffset,
      buttonWidth,
      buttonHeight,
      20
    );

    // Black border - same thickness as header (8px)
    buttonBg.lineStyle(8, 0x000000, 1);
    buttonBg.strokeRoundedRect(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      20
    );

    // Purple background (VeeFriends purple)
    buttonBg.fillStyle(0x4a2b7c, 1);
    buttonBg.fillRoundedRect(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      20
    );

    // Button text - White with thick black border
    const buttonText = this.add.text(buttonX, buttonY, "ALBUM", {
      fontSize: "44px", // Reduced from 48px to prevent cutoff with thick border
      color: "#FFFFFF", // White
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000", // Black border
      strokeThickness: 8, // Thick border for visibility
      wordWrap: { width: buttonWidth - 30 }, // Prevent text cutoff with more padding
    });
    buttonText.setOrigin(0.5);

    // Create interactive zone for the entire button
    const buttonZone = this.add.zone(
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight
    );
    buttonZone.setInteractive();

    // Cursor change on hover
    buttonZone.on("pointerover", () => {
      this.input.setDefaultCursor("pointer");
    });

    buttonZone.on("pointerout", () => {
      this.input.setDefaultCursor("default");
    });

    // Click handler - Open album
    buttonZone.on("pointerdown", () => {
      this.playButtonSound();
      MenuMusicController.play(this);
      // Start the album scene
      this.scene.start("AlbumScene");
    });
  }

  private createShopButton() {
    const { width, height } = GameSettings.canvas;

    const buttonWidth = 320;
    const buttonHeight = 90;
    const buttonX = width / 2;
    const buttonY = height / 2 + 240; // Below Album button (120px spacing between buttons - same as PLAY to ALBUM)
    const shadowOffset = 8;

    // Create button graphics
    const buttonBg = this.add.graphics();

    // Black shadow (right and bottom)
    buttonBg.fillStyle(0x000000, 1);
    buttonBg.fillRoundedRect(
      buttonX - buttonWidth / 2 + shadowOffset,
      buttonY - buttonHeight / 2 + shadowOffset,
      buttonWidth,
      buttonHeight,
      20
    );

    // Black border - same thickness as header (8px)
    buttonBg.lineStyle(8, 0x000000, 1);
    buttonBg.strokeRoundedRect(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      20
    );

    // Green background for shop button
    buttonBg.fillStyle(0x2ecc71, 1); // Green color
    buttonBg.fillRoundedRect(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      20
    );

    // Button text - White with thick black border
    const buttonText = this.add.text(buttonX, buttonY, "SHOP", {
      fontSize: "44px", // Reduced from 48px to prevent cutoff with thick border
      color: "#FFFFFF", // White text
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000", // Black border
      strokeThickness: 8, // Thick border for visibility
      wordWrap: { width: buttonWidth - 30 }, // Prevent text cutoff with more padding
    });
    buttonText.setOrigin(0.5);

    // "Coming Soon" badge - Small yellow badge below button text
    const badgeWidth = 140;
    const badgeHeight = 30;
    const badgeX = buttonX;
    const badgeY = buttonY + 42; // Just below the button text

    const badgeBg = this.add.graphics();

    // Black border for badge
    badgeBg.lineStyle(3, 0x000000, 1);
    badgeBg.strokeRoundedRect(
      badgeX - badgeWidth / 2,
      badgeY - badgeHeight / 2,
      badgeWidth,
      badgeHeight,
      8
    );

    // Yellow background (VeeFriends yellow)
    badgeBg.fillStyle(0xf7ea48, 1);
    badgeBg.fillRoundedRect(
      badgeX - badgeWidth / 2,
      badgeY - badgeHeight / 2,
      badgeWidth,
      badgeHeight,
      8
    );

    // Badge text
    const badgeText = this.add.text(badgeX, badgeY, "COMING SOON", {
      fontSize: "18px",
      color: "#000000",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
    });
    badgeText.setOrigin(0.5);

    // Create interactive zone for the entire button
    const buttonZone = this.add.zone(
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight
    );
    buttonZone.setInteractive();

    // Cursor change on hover
    buttonZone.on("pointerover", () => {
      this.input.setDefaultCursor("pointer");
    });

    buttonZone.on("pointerout", () => {
      this.input.setDefaultCursor("default");
    });

    // Click handler - Shop functionality (to be implemented)
    buttonZone.on("pointerdown", () => {
      this.playButtonSound();
      console.log("Shop button clicked - functionality to be implemented");
      MenuMusicController.play(this);
      // TODO: Implement shop scene
    });
  }

  private showInstructionsModal() {
    const { width, height } = GameSettings.canvas;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.7
    );
    overlay.setScrollFactor(0);
    overlay.setDepth(100);

    // Modal dimensions - increased height
    const modalWidth = 520;
    const modalHeight = 740;
    const modalX = width / 2;
    const modalY = height / 2;
    const shadowOffset = 12;

    // Create modal background graphics
    const modalBg = this.add.graphics();
    modalBg.setScrollFactor(0);
    modalBg.setDepth(101);

    // Shadow
    modalBg.fillStyle(0x000000, 0.5);
    modalBg.fillRoundedRect(
      modalX - modalWidth / 2 + shadowOffset,
      modalY - modalHeight / 2 + shadowOffset,
      modalWidth,
      modalHeight,
      25
    );

    // Black border
    modalBg.lineStyle(8, 0x000000, 1);
    modalBg.strokeRoundedRect(
      modalX - modalWidth / 2,
      modalY - modalHeight / 2,
      modalWidth,
      modalHeight,
      25
    );

    // Main background
    modalBg.fillStyle(0xe8f4f8, 1);
    modalBg.fillRoundedRect(
      modalX - modalWidth / 2,
      modalY - modalHeight / 2,
      modalWidth,
      modalHeight,
      25
    );

    // Modal background image - sin comprimir, centrado
    const modalBackground = this.add.image(modalX, modalY, "modal-background");
    modalBackground.setScrollFactor(0);
    modalBackground.setDepth(101);

    // Mask for rounded corners
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(
      modalX - modalWidth / 2 + 8,
      modalY - modalHeight / 2 + 8,
      modalWidth - 16,
      modalHeight - 16,
      20
    );
    const mask = maskShape.createGeometryMask();
    modalBackground.setMask(mask);

    // Title - "HOW TO PLAY" in green
    const titleText = this.add.text(modalX, modalY - 310, "HOW TO PLAY", {
      fontSize: "52px",
      color: "#00FF88",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000",
      strokeThickness: 8,
    });
    titleText.setOrigin(0.5);
    titleText.setScrollFactor(0);
    titleText.setDepth(102);

    // Instructions list with icons
    const instructions = [
      { icon: "🔍", text: "Move around the map and\nfind the VeeFriend" },
      { icon: "👆", text: "Double click/tap when you\nfind it" },
      { icon: "⏰", text: "Hurry before time runs out" },
      { icon: "⭐", text: "Collect them all and level\nthem up" },
    ];

    const startY = modalY - 240;
    const lineHeight = 135;
    const leftPadding = 60;
    const iconSize = 52;
    const iconTextGap = 25;
    const maxWidth = modalWidth - leftPadding * 2 - iconSize - iconTextGap;

    instructions.forEach((instruction, index) => {
      const yPos = startY + index * lineHeight;

      // Instruction text
      const instructionText = this.add.text(
        modalX - modalWidth / 2 + leftPadding + iconSize + iconTextGap,
        yPos,
        instruction.text,
        {
          fontSize: "32px",
          color: "#000000",
          fontFamily: "Chicle, cursive",
          fontStyle: "normal",
          align: "left",
          lineSpacing: 5,
          wordWrap: { width: maxWidth },
        }
      );
      instructionText.setOrigin(0, 0);
      instructionText.setScrollFactor(0);
      instructionText.setDepth(102);

      // Icon centrado verticalmente con el texto
      const iconYCentered = yPos + instructionText.height / 2;

      const iconText = this.add.text(
        modalX - modalWidth / 2 + leftPadding,
        iconYCentered,
        instruction.icon,
        {
          fontSize: `${iconSize}px`,
        }
      );
      iconText.setOrigin(0, 0.5);
      iconText.setScrollFactor(0);
      iconText.setDepth(102);
    });

    // START button
    const buttonWidth = 280;
    const buttonHeight = 70;
    const buttonY = modalY + 305;

    const buttonBg = this.add.graphics();
    buttonBg.setScrollFactor(0);
    buttonBg.setDepth(101);

    // Black shadow
    buttonBg.fillStyle(0x000000, 1);
    buttonBg.fillRoundedRect(
      modalX - buttonWidth / 2 + shadowOffset,
      buttonY - buttonHeight / 2 + shadowOffset,
      buttonWidth,
      buttonHeight,
      12
    );

    // Black border
    buttonBg.lineStyle(8, 0x000000, 1);
    buttonBg.strokeRoundedRect(
      modalX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      12
    );

    // Yellow background
    buttonBg.fillStyle(0xf7ea48, 1);
    buttonBg.fillRoundedRect(
      modalX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      12
    );

    const buttonText = this.add.text(modalX, buttonY, "START", {
      fontSize: "38px",
      color: "#000000",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
    });
    buttonText.setOrigin(0.5);
    buttonText.setScrollFactor(0);
    buttonText.setDepth(102);

    // Create interactive zone for button
    const buttonZone = this.add.zone(
      modalX,
      buttonY,
      buttonWidth,
      buttonHeight
    );
    buttonZone.setInteractive();
    buttonZone.setScrollFactor(0);
    buttonZone.setDepth(102);

    // Cursor change on hover
    buttonZone.on("pointerover", () => {
      this.input.setDefaultCursor("pointer");
    });

    buttonZone.on("pointerout", () => {
      this.input.setDefaultCursor("default");
    });

    // Button click handler
    buttonZone.on("pointerdown", () => {
      this.playButtonSound();

      // Clean up modal
      overlay.destroy();
      modalBg.destroy();
      modalBackground.destroy();
      maskShape.destroy();
      titleText.destroy();
      buttonBg.destroy();
      buttonText.destroy();
      buttonZone.destroy();

      // Start the game
      MenuMusicController.stop(this);
      this.scene.start("GameScene");
    });
  }
}
