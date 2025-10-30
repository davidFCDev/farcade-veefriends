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

    // Load main page background
    this.load.image(
      "main-background",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/mainpage-white-A52rWA2qQJFnZBJBeLVxpH9X8hUWzj.png"
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

    // Title text - "Where is the VeeFriend?" at the top
    const titleY = 200; // Position from top
    const titleText = this.add.text(
      width / 2,
      titleY,
      "WHERE IS THE\nVEEFRIEND?",
      {
        fontSize: "96px", // Larger font size (was 82px)
        color: "#F7EA48", // VeeFriends yellow
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        align: "center",
        stroke: "#000000", // Black border
        strokeThickness: 10, // Border thickness
        wordWrap: { width: width - 100 }, // More padding to prevent text cutoff (was 60)
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

    // Button text - Black
    const buttonText = this.add.text(buttonX, buttonY, "PLAY", {
      fontSize: "48px", // Reduced from 52px to prevent cutoff
      color: "#000000", // Black
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
    });
    buttonText.setOrigin(0.5);
    buttonText.setInteractive();

    // Make entire button area interactive
    const hitArea = new Phaser.Geom.Rectangle(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight
    );
    buttonText.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Hover effect
    buttonText.on("pointerover", () => {
      buttonText.setScale(1.05);
    });

    buttonText.on("pointerout", () => {
      buttonText.setScale(1);
    });

    // Click handler - Start game
    buttonText.on("pointerdown", () => {
      // Pulse animation on click
      this.tweens.add({
        targets: [buttonText, buttonBg],
        scale: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          // Start the game scene
          this.scene.start("GameScene");
        },
      });
    });
  }
}
