import GameSettings from "../config/GameSettings";

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

    // Load main page background (updated image)
    this.load.image(
      "main-background",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/mainpage-final-mTwDTokRDsRhC5MEBhHlb0Eo6dKHEa.png"
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
          offsetX: 10,
          offsetY: 10,
          color: "#000000",
          blur: 0, // No blur for opaque shadow
          fill: true,
        },
      }
    );
    titleText.setOrigin(0.5);

    // Play button in the center
    this.createPlayButton();

    // Album button below Play button
    this.createAlbumButton();

    // Shop button below Album button
    this.createShopButton();
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
      // Start the game scene
      this.scene.start("GameScene");
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
      console.log("Shop button clicked - functionality to be implemented");
      // TODO: Implement shop scene
    });
  }
}
