import {
  CharacterData,
  getAllCharacters,
  getCharactersByLevel,
} from "../config/CharactersData";
import GameSettings from "../config/GameSettings";

export class GameScene extends Phaser.Scene {
  // Cameras
  private gameCamera!: Phaser.Cameras.Scene2D.Camera;
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;

  // UI Elements
  private header!: Phaser.GameObjects.Container;
  private timeBar!: Phaser.GameObjects.Graphics;
  private timeBarBackground!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private clockCircle!: Phaser.GameObjects.Graphics;
  private clockHand!: Phaser.GameObjects.Graphics;
  private clockFill!: Phaser.GameObjects.Graphics;

  // Game Map
  private mapContainer!: Phaser.GameObjects.Container;
  private mapBackground!: Phaser.GameObjects.Rectangle;

  // Character to find
  private characterSprites: Phaser.GameObjects.Image[] = [];
  private currentCharacter!: CharacterData; // Current character data for this level
  private foundCharacters: Set<string> = new Set(); // IDs of found characters (for album)

  // Camera Controls
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private lastTapTime: number = 0;
  private doubleTapDelay: number = 300; // ms
  private minZoom: number = 1;
  private maxZoom: number = 3;
  private initialZoom: number = 1.5;

  // Game State
  private currentLevel: number = 1;
  private currentScore: number = 0;
  private strikes: number = 0;
  private maxStrikes: number = 2;
  private timeRemaining: number = 1; // 0 to 1 (100%)
  private levelTimer?: Phaser.Time.TimerEvent; // Timer for level countdown

  // Map Settings
  private readonly MAP_WIDTH = 3240; // 4.5x canvas width for horizontal scrolling
  private readonly MAP_HEIGHT = 1620; // 1.5x canvas height for vertical scrolling
  private readonly HEADER_HEIGHT = 80;
  private readonly TIME_BAR_HEIGHT = 20;
  private readonly TIME_BAR_PADDING = 10;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: {
    currentLevel?: number;
    currentScore?: number;
    foundCharacters?: Set<string>;
  }) {
    // Restore level, score, and found characters from previous level
    if (data.currentLevel !== undefined) {
      this.currentLevel = data.currentLevel;
    }
    if (data.currentScore !== undefined) {
      this.currentScore = data.currentScore;
    }
    if (data.foundCharacters !== undefined) {
      this.foundCharacters = data.foundCharacters;
    }

    // Reset game state for new level
    this.strikes = 0;
    this.timeRemaining = 1;
    this.isDragging = false;

    // Clean up gradient textures from previous level to prevent conflicts
    if (this.textures.exists("introModalGradient")) {
      this.textures.remove("introModalGradient");
    }
    if (this.textures.exists("foundModalGradient")) {
      this.textures.remove("foundModalGradient");
    }
    if (this.textures.exists("headerGradient")) {
      this.textures.remove("headerGradient");
    }
  }

  preload() {
    // Load WebFont for Chicle
    this.load.script(
      "webfont",
      "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
    );

    // Load all character images dynamically
    this.loadCharacterImages();

    // Load map backgrounds for all levels
    this.loadLevelMaps();
  }

  private loadCharacterImages() {
    const characters = getAllCharacters();

    characters.forEach((character) => {
      // Load map image (for placing on the map)
      this.load.image(`${character.id}-map`, character.mapImageUrl);

      // Load card image (for album/modals)
      this.load.image(`${character.id}-card`, character.cardImageUrl);
    });
  }

  private loadLevelMaps() {
    // Map backgrounds for each level (1-13)
    const levelMaps = [
      { level: 1, url: "https://i.postimg.cc/Kvyr2K7t/Level1.png" },
      { level: 2, url: "https://i.postimg.cc/g2zVxfTG/Level2.png" },
      { level: 3, url: "https://i.postimg.cc/x1fvXW4Q/Level3.png" },
      { level: 4, url: "https://i.postimg.cc/VkfqJ3V8/level4.png" },
      { level: 5, url: "https://i.postimg.cc/524BXZR1/level5.png" },
      { level: 6, url: "https://i.postimg.cc/YCd1Yb59/level6.png" },
      { level: 7, url: "https://i.postimg.cc/vZ0Wf3JG/level7.png" },
      { level: 8, url: "https://i.postimg.cc/13vpwJkX/level8.png" },
      { level: 9, url: "https://i.postimg.cc/DwxqLB98/level9.png" },
      { level: 10, url: "https://i.postimg.cc/x16KMtwm/level10.png" },
      { level: 11, url: "https://i.postimg.cc/T3trgCzm/level11.png" },
      { level: 12, url: "https://i.postimg.cc/y8LFcvMm/level12.png" },
      { level: 13, url: "https://i.postimg.cc/fR8xmBGv/level13.png" },
    ];

    levelMaps.forEach((levelMap) => {
      this.load.image(`level-${levelMap.level}-bg`, levelMap.url);
    });
  }

  create() {
    // Load Google Font Chicle before creating UI
    (window as any).WebFont.load({
      google: {
        families: ["Chicle"],
      },
      active: () => {
        this.initializeGame();
      },
    });
  }

  private initializeGame() {
    // Set default cursor to pointer (hand) for the entire canvas
    this.input.setDefaultCursor("pointer");

    // Load character for current level
    this.loadCurrentLevelCharacter();

    // Setup cameras first
    this.setupCameras();

    // Create the map container
    this.createMap();

    // Create UI (fixed to UI camera)
    this.createUI();

    // Setup input controls
    this.setupControls();

    // Show initial modal with character to find
    this.showCharacterIntroModal();
  }

  private loadCurrentLevelCharacter() {
    // Get characters for current level
    const levelCharacters = getCharactersByLevel(this.currentLevel);

    if (levelCharacters.length === 0) {
      console.error(`No character found for level ${this.currentLevel}`);
      // Fallback to first character
      this.currentCharacter = getAllCharacters()[0];
    } else {
      // For now, take the first character of the level
      // Later we can randomize or have multiple characters per level
      this.currentCharacter = levelCharacters[0];
    }

    console.log(`Level ${this.currentLevel}: ${this.currentCharacter.name}`);
  }

  private setupCameras() {
    // Main camera is for the game world (map)
    this.gameCamera = this.cameras.main;

    // Create a second camera for UI (always fixed, no zoom, no scroll)
    this.uiCamera = this.cameras.add(
      0,
      0,
      GameSettings.canvas.width,
      GameSettings.canvas.height
    );
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.setZoom(1);

    // Make sure UI camera ignores game objects by default
    this.uiCamera.ignore([]);
  }

  private createMap() {
    // Create container for all map elements at header position
    this.mapContainer = this.add.container(0, this.HEADER_HEIGHT);

    // Create map background image using current level
    const mapKey = `level-${this.currentLevel}-bg`;
    const mapImage = this.add.image(0, 0, mapKey);
    mapImage.setOrigin(0, 0); // Set origin to top-left

    // Make sure UI camera ignores the map
    this.uiCamera.ignore(mapImage);

    // Get actual image dimensions
    const imageWidth = mapImage.width;
    const imageHeight = mapImage.height;

    // Calculate minimum zoom to cover the available screen (excluding header)
    const { width, height } = GameSettings.canvas;
    const availableHeight = height - this.HEADER_HEIGHT; // Subtract header height
    const scaleX = width / imageWidth;
    const scaleY = availableHeight / imageHeight;

    // Use the larger scale to ensure the image always covers the screen completely (no black bars)
    this.minZoom = Math.max(scaleX, scaleY);

    // Set initial zoom to minimum to see the whole map
    this.initialZoom = this.minZoom;

    // Update max zoom (no zoom allowed, keep it fixed)
    this.maxZoom = this.minZoom;

    // Update game camera bounds to match image size
    // Bounds are in world coordinates, container is already offset by HEADER_HEIGHT
    this.gameCamera.setBounds(
      0,
      0,
      imageWidth,
      imageHeight + this.HEADER_HEIGHT
    );

    // Set initial zoom on game camera
    this.gameCamera.setZoom(this.initialZoom);

    // Center game camera on the visible area (container position already accounts for header)
    this.gameCamera.centerOn(
      imageWidth / 2,
      this.HEADER_HEIGHT + imageHeight / 2
    );

    this.mapContainer.add(mapImage);

    // Make sure UI camera ignores the map container
    this.uiCamera.ignore(this.mapContainer);

    // Place characters on the map
    this.placeCharactersOnMap(imageWidth, imageHeight);
  }

  private placeCharactersOnMap(mapWidth: number, mapHeight: number) {
    const characterSize = 80; // Size for map sprite
    const padding = 200;

    // Clear any existing characters
    this.characterSprites = [];

    // Create the current level's character on the map (using map image)
    this.createCharacterAtRandomPosition(
      `${this.currentCharacter.id}-map`, // Use map image key
      true, // This is the one to find
      mapWidth,
      mapHeight,
      characterSize,
      padding
    );

    console.log(
      `Character to find: ${this.currentCharacter.name} (Level ${this.currentLevel})`
    );
    console.log(`Total characters: ${this.characterSprites.length}`);
  }

  private createCharacterAtRandomPosition(
    poseKey: string,
    isCorrect: boolean,
    mapWidth: number,
    mapHeight: number,
    size: number,
    padding: number
  ) {
    // Random position
    const x = Phaser.Math.Between(padding, mapWidth - padding);
    const y = Phaser.Math.Between(padding, mapHeight - padding);

    // Create character sprite
    const character = this.add.image(x, y, poseKey);
    // Use setScale instead of setDisplaySize for better quality
    const scale = size / Math.max(character.width, character.height);
    character.setScale(scale);
    character.setInteractive();
    character.setData("isCorrect", isCorrect);
    character.setData("poseKey", poseKey);

    // Add click handler
    character.on("pointerdown", () => this.onCharacterClick(character));

    // Add to map container
    this.mapContainer.add(character);
    this.characterSprites.push(character);

    // Make UI camera ignore the character
    this.uiCamera.ignore(character);
  }

  private onCharacterClick(character: Phaser.GameObjects.Image) {
    const isCorrect = character.getData("isCorrect");

    console.log(`Clicked character, Correct: ${isCorrect}`);

    if (isCorrect) {
      console.log(`Correct character found: ${this.currentCharacter.name}!`);
      // Add to found characters collection
      this.foundCharacters.add(this.currentCharacter.id);
      this.showFoundModal();
    } else {
      console.log("Wrong character! Strike added");
      this.addStrike();
    }
  }

  private addStrike() {
    this.strikes++;
    console.log(`Strikes: ${this.strikes}/${this.maxStrikes}`);

    if (this.strikes >= this.maxStrikes) {
      console.log("¡Game Over! Demasiados strikes");
      this.showGameOverModal();
    } else {
      // TODO: Show visual feedback for strike
      this.showStrikeFeedback();
    }
  }

  private showStrikeFeedback() {
    // Visual feedback for incorrect selection - Pengu style
    const { width, height } = GameSettings.canvas;

    const strikeText = this.add.text(width / 2, height / 2, "¡INCORRECTO!", {
      fontSize: "72px",
      color: "#FF1744",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#FFFFFF",
      strokeThickness: 8,
    });
    strikeText.setOrigin(0.5);
    strikeText.setScrollFactor(0);
    strikeText.setDepth(200);
    strikeText.setAlpha(0);

    // Black outline
    const strikeOutline = this.add.text(width / 2, height / 2, "¡INCORRECTO!", {
      fontSize: "72px",
      color: "#FF1744",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000",
      strokeThickness: 14,
    });
    strikeOutline.setOrigin(0.5);
    strikeOutline.setScrollFactor(0);
    strikeOutline.setDepth(199);
    strikeOutline.setAlpha(0);

    this.gameCamera.ignore([strikeText, strikeOutline]);

    // Animate in and out with bounce
    this.tweens.add({
      targets: [strikeText, strikeOutline],
      alpha: 1,
      scale: 1.3,
      duration: 200,
      ease: "Back.easeOut",
      yoyo: true,
      onComplete: () => {
        strikeText.destroy();
        strikeOutline.destroy();
      },
    });
  }

  private showGameOverModal() {
    const { width, height } = GameSettings.canvas;

    // Stop the level timer
    if (this.levelTimer) {
      this.levelTimer.remove();
    }

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

    // Modal background - Light with shadow (Pengu style)
    const modalWidth = 500;
    const modalHeight = 300;
    const modalX = width / 2;
    const modalY = height / 2;

    const modalBg = this.add.graphics();
    modalBg.setScrollFactor(0);
    modalBg.setDepth(101);

    // Black border (outer)
    modalBg.fillStyle(0x000000, 1);
    modalBg.fillRoundedRect(
      modalX - modalWidth / 2 - 4,
      modalY - modalHeight / 2 - 4,
      modalWidth + 8,
      modalHeight + 8,
      25
    );

    // Shadow
    modalBg.fillStyle(0xb0b0b0, 1);
    modalBg.fillRoundedRect(
      modalX - modalWidth / 2 + 3,
      modalY - modalHeight / 2 + 3,
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

    // "GAME OVER!" text - Red with white outline (Pengu style)
    const gameOverOutline = this.add.text(modalX, modalY - 40, "¡GAME OVER!", {
      fontSize: "60px",
      color: "#FF1744",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000",
      strokeThickness: 12,
    });
    gameOverOutline.setOrigin(0.5);
    gameOverOutline.setScrollFactor(0);
    gameOverOutline.setDepth(101);

    const gameOverText = this.add.text(modalX, modalY - 40, "¡GAME OVER!", {
      fontSize: "60px",
      color: "#FF1744",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#FFFFFF",
      strokeThickness: 8,
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setDepth(102);

    // Retry button - Yellow with white stroke (Pengu INSTRUCTIONS style)
    const buttonWidth = 260;
    const buttonHeight = 65;
    const buttonY = modalY + 70;

    const buttonBg = this.add.graphics();
    buttonBg.setScrollFactor(0);
    buttonBg.setDepth(101);

    // White outer stroke
    buttonBg.fillStyle(0xffffff, 1);
    buttonBg.fillRoundedRect(
      modalX - buttonWidth / 2 - 5,
      buttonY - buttonHeight / 2 - 5,
      buttonWidth + 10,
      buttonHeight + 10,
      20
    );

    // Black inner border
    buttonBg.fillStyle(0x000000, 1);
    buttonBg.fillRoundedRect(
      modalX - buttonWidth / 2 - 3,
      buttonY - buttonHeight / 2 - 3,
      buttonWidth + 6,
      buttonHeight + 6,
      18
    );

    // Yellow background
    buttonBg.fillStyle(0xffd700, 1);
    buttonBg.fillRoundedRect(
      modalX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      16
    );

    const buttonText = this.add.text(modalX, buttonY, "REINTENTAR", {
      fontSize: "28px",
      color: "#FFFFFF",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000",
      strokeThickness: 6,
    });
    buttonText.setOrigin(0.5);
    buttonText.setScrollFactor(0);
    buttonText.setDepth(102);
    buttonText.setInteractive();

    // Button click handler
    buttonText.on("pointerdown", () => {
      // Restart scene
      this.scene.restart();
    });

    // Make game camera ignore modal elements
    this.gameCamera.ignore([
      overlay,
      modalBg,
      gameOverText,
      gameOverOutline,
      buttonBg,
      buttonText,
    ]);
  }

  private onCharacterClick_old(index: number) {
    console.log("¡Personaje encontrado!");
    this.showFoundModal();
  }

  private showCharacterIntroModal() {
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

    // Modal background - VeeFriends purple style (mismo que modal de FOUND)
    const modalWidth = 600;
    const modalHeight = 680;
    const modalX = width / 2;
    const modalY = height / 2;
    const shadowOffset = 8; // Mismo grosor de sombra

    const modalBg = this.add.graphics();
    modalBg.setScrollFactor(0);
    modalBg.setDepth(101);

    // Black shadow (right and bottom) - gordo
    modalBg.fillStyle(0x000000, 1);
    modalBg.fillRoundedRect(
      modalX - modalWidth / 2 + shadowOffset,
      modalY - modalHeight / 2 + shadowOffset,
      modalWidth,
      modalHeight,
      25
    );

    // Black border (outer) - same thickness as header (8px)
    modalBg.lineStyle(8, 0x000000, 1);
    modalBg.strokeRoundedRect(
      modalX - modalWidth / 2,
      modalY - modalHeight / 2,
      modalWidth,
      modalHeight,
      25
    );

    // Create gradient texture for modal background
    let modalGradient: Phaser.GameObjects.Image | null = null;
    let maskShape: Phaser.GameObjects.Graphics | null = null;

    const gradientTexture = this.textures.createCanvas(
      "introModalGradient",
      modalWidth,
      modalHeight
    );
    if (gradientTexture) {
      const gradientContext = gradientTexture.getContext();
      const gradient = gradientContext.createLinearGradient(
        0,
        0,
        0,
        modalHeight
      );
      gradient.addColorStop(0, "#4A2B7C"); // Lighter purple at top
      gradient.addColorStop(1, "#1A0E2E"); // Darker purple at bottom
      gradientContext.fillStyle = gradient;
      gradientContext.fillRect(0, 0, modalWidth, modalHeight);
      gradientTexture.refresh();

      // Add gradient as image
      modalGradient = this.add.image(modalX, modalY, "introModalGradient");
      modalGradient.setScrollFactor(0);
      modalGradient.setDepth(101);
      modalGradient.setDisplaySize(modalWidth, modalHeight);

      // Mask to create rounded corners
      maskShape = this.make.graphics({});
      maskShape.fillStyle(0xffffff);
      maskShape.fillRoundedRect(
        modalX - modalWidth / 2,
        modalY - modalHeight / 2,
        modalWidth,
        modalHeight,
        25
      );
      const mask = maskShape.createGeometryMask();
      modalGradient.setMask(mask);
    }

    // Title - Green like FOUND text (VeeFriends style)
    const titleText = this.add.text(modalX, modalY - 250, "WHERE IS?", {
      fontSize: "86px",
      color: "#00FF88",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000",
      strokeThickness: 8,
    });
    titleText.setOrigin(0.5);
    titleText.setScrollFactor(0);
    titleText.setDepth(102);

    // Subtitle - White text
    const subtitleText = this.add.text(
      modalX,
      modalY - 155,
      "Find it before time runs out!",
      {
        fontSize: "32px",
        color: "#FFFFFF",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
      }
    );
    subtitleText.setOrigin(0.5);
    subtitleText.setScrollFactor(0);
    subtitleText.setDepth(102);

    // White circle background for character (cartoon style)
    const circleBg = this.add.graphics();
    circleBg.setScrollFactor(0);
    circleBg.setDepth(101);
    circleBg.fillStyle(0xffffff, 1);
    circleBg.fillCircle(modalX, modalY + 30, 130); // Radio de 130px

    // Black border for circle
    circleBg.lineStyle(4, 0x000000, 1);
    circleBg.strokeCircle(modalX, modalY + 30, 130);

    // Character image to find (using card image for display)
    const characterPreview = this.add.image(
      modalX,
      modalY + 30,
      `${this.currentCharacter.id}-card`
    );
    characterPreview.setDisplaySize(350, 350);
    characterPreview.setScrollFactor(0);
    characterPreview.setDepth(102);

    // Countdown text - Below character and circle
    const countdownText = this.add.text(modalX, modalY + 240, "Ready", {
      fontSize: "72px",
      color: "#F7EA48",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000",
      strokeThickness: 8,
    });
    countdownText.setOrigin(0.5);
    countdownText.setScrollFactor(0);
    countdownText.setDepth(103);

    // Make game camera ignore modal elements
    const elementsToIgnore: any[] = [
      overlay,
      modalBg,
      titleText,
      subtitleText,
      circleBg,
      characterPreview,
      countdownText,
    ];

    if (modalGradient) elementsToIgnore.push(modalGradient);
    if (maskShape) elementsToIgnore.push(maskShape);

    this.gameCamera.ignore(elementsToIgnore);

    // Countdown logic
    const countdownWords = ["Ready", "Steady", "GO"];
    let countdownIndex = 0;
    const countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        countdownIndex++;
        if (countdownIndex < countdownWords.length) {
          countdownText.setText(countdownWords[countdownIndex]);

          // Pulse animation
          this.tweens.add({
            targets: countdownText,
            scale: { from: 1.5, to: 1 },
            duration: 300,
            ease: "Back.easeOut",
          });
        } else {
          // Close modal and start game
          overlay.destroy();
          modalBg.destroy();
          if (modalGradient) modalGradient.destroy();
          if (maskShape) maskShape.destroy();
          titleText.destroy();
          subtitleText.destroy();
          circleBg.destroy();
          characterPreview.destroy();
          countdownText.destroy();

          // Start game timer
          this.startLevelTimer();
        }
      },
      repeat: 2,
    });
  }

  private showFoundModal() {
    const { width, height } = GameSettings.canvas;

    // Stop the level timer
    if (this.levelTimer) {
      this.levelTimer.remove();
    }

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

    // Modal background - VeeFriends purple style (más grande)
    const modalWidth = 600;
    const modalHeight = 550;
    const modalX = width / 2;
    const modalY = height / 2;
    const shadowOffset = 8; // Mismo grosor que el botón

    const modalBg = this.add.graphics();
    modalBg.setScrollFactor(0);
    modalBg.setDepth(101);

    // Black shadow (right and bottom) - gordo
    modalBg.fillStyle(0x000000, 1);
    modalBg.fillRoundedRect(
      modalX - modalWidth / 2 + shadowOffset,
      modalY - modalHeight / 2 + shadowOffset,
      modalWidth,
      modalHeight,
      25
    );

    // Black border (outer) - same thickness as header (8px)
    modalBg.lineStyle(8, 0x000000, 1);
    modalBg.strokeRoundedRect(
      modalX - modalWidth / 2,
      modalY - modalHeight / 2,
      modalWidth,
      modalHeight,
      25
    );

    // Create gradient texture for modal background
    let foundModalGradient: Phaser.GameObjects.Image | null = null;
    let foundMaskShape: Phaser.GameObjects.Graphics | null = null;

    const foundGradientTexture = this.textures.createCanvas(
      "foundModalGradient",
      modalWidth,
      modalHeight
    );
    if (foundGradientTexture) {
      const ctx = foundGradientTexture.getContext();
      const gradient = ctx.createLinearGradient(0, 0, 0, modalHeight);
      gradient.addColorStop(0, "#4A2B7C"); // Lighter purple at top
      gradient.addColorStop(1, "#1A0E2E"); // Darker purple at bottom
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, modalWidth, modalHeight);
      foundGradientTexture.refresh();

      foundModalGradient = this.add.image(modalX, modalY, "foundModalGradient");
      foundModalGradient.setScrollFactor(0);
      foundModalGradient.setDepth(101);
      foundModalGradient.setDisplaySize(modalWidth, modalHeight);

      // Mask to create rounded corners
      foundMaskShape = this.make.graphics({});
      foundMaskShape.fillStyle(0xffffff);
      foundMaskShape.fillRoundedRect(
        modalX - modalWidth / 2,
        modalY - modalHeight / 2,
        modalWidth,
        modalHeight,
        25
      );
      const foundMask = foundMaskShape.createGeometryMask();
      foundModalGradient.setMask(foundMask);
    }

    // "FOUND!" text - Green like image 1 (CHARACTERS style)
    const foundText = this.add.text(modalX, modalY - 170, "FOUND!", {
      fontSize: "96px",
      color: "#00FF88",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000",
      strokeThickness: 8,
    });
    foundText.setOrigin(0.5);
    foundText.setScrollFactor(0);
    foundText.setDepth(102);

    // Character name text
    const characterNameText = this.add.text(
      modalX,
      modalY - 60,
      this.currentCharacter.name,
      {
        fontSize: "50px",
        color: "#F7EA48",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        stroke: "#000000",
        strokeThickness: 5,
      }
    );
    characterNameText.setOrigin(0.5);
    characterNameText.setScrollFactor(0);
    characterNameText.setDepth(102);

    // "Added to collection" message
    const collectionText = this.add.text(
      modalX,
      modalY + 12,
      "added to your collection!",
      {
        fontSize: "28px",
        color: "#FFFFFF",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
      }
    );
    collectionText.setOrigin(0.5);
    collectionText.setScrollFactor(0);
    collectionText.setDepth(102);

    // Score points text - White description
    const pointsText = this.add.text(modalX, modalY + 60, "+100 POINTS", {
      fontSize: "38px",
      color: "#FFFFFF",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
    });
    pointsText.setOrigin(0.5);
    pointsText.setScrollFactor(0);
    pointsText.setDepth(102);

    // Continue button - Yellow with black border and shadow
    const buttonWidth = 280;
    const buttonHeight = 70;
    const buttonY = modalY + 140;
    // Usa el mismo shadowOffset que el modal

    const buttonBg = this.add.graphics();
    buttonBg.setScrollFactor(0);
    buttonBg.setDepth(101);

    // Black shadow (right and bottom) - gordo
    buttonBg.fillStyle(0x000000, 1);
    buttonBg.fillRoundedRect(
      modalX - buttonWidth / 2 + shadowOffset,
      buttonY - buttonHeight / 2 + shadowOffset,
      buttonWidth,
      buttonHeight,
      12
    );

    // Black border - same thickness as header (8px)
    buttonBg.lineStyle(8, 0x000000, 1);
    buttonBg.strokeRoundedRect(
      modalX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      12
    );

    // Yellow background (VeeFriends yellow)
    buttonBg.fillStyle(0xf7ea48, 1);
    buttonBg.fillRoundedRect(
      modalX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      12
    );

    const buttonText = this.add.text(modalX, buttonY, "CONTINUE", {
      fontSize: "32px",
      color: "#000000",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
    });
    buttonText.setOrigin(0.5);
    buttonText.setScrollFactor(0);
    buttonText.setDepth(102);
    buttonText.setInteractive();

    // Button click handler
    buttonText.on("pointerdown", () => {
      // Clean up modal
      overlay.destroy();
      modalBg.destroy();
      if (foundModalGradient) foundModalGradient.destroy();
      if (foundMaskShape) foundMaskShape.destroy();
      foundText.destroy();
      characterNameText.destroy();
      collectionText.destroy();
      pointsText.destroy();
      buttonBg.destroy();
      buttonText.destroy();

      // Add score
      this.updateScore(100);

      // Go to next level
      this.goToNextLevel();
    });

    // Make game camera ignore modal elements
    const foundElementsToIgnore: any[] = [
      overlay,
      modalBg,
      foundText,
      characterNameText,
      collectionText,
      pointsText,
      buttonBg,
      buttonText,
    ];

    if (foundModalGradient) foundElementsToIgnore.push(foundModalGradient);
    if (foundMaskShape) foundElementsToIgnore.push(foundMaskShape);

    this.gameCamera.ignore(foundElementsToIgnore);
  }

  private onCorrectCharacterFound() {
    // This method is no longer needed but keeping for reference
    this.updateScore(100);
  }

  private createUI() {
    const { width, height } = GameSettings.canvas;

    // Header background with gradient from top to bottom
    const headerBg = this.add.graphics();

    // Black border for header - same thickness as clock border (8px)
    headerBg.fillStyle(0x000000, 1);
    headerBg.fillRect(0, 0, width, this.HEADER_HEIGHT + 8);

    // Create gradient texture for header
    const headerGradientTexture = this.textures.createCanvas(
      "headerGradient",
      width,
      this.HEADER_HEIGHT
    );
    if (headerGradientTexture) {
      const ctx = headerGradientTexture.getContext();
      const gradient = ctx.createLinearGradient(0, 0, 0, this.HEADER_HEIGHT);
      gradient.addColorStop(0, "#4A2B7C"); // Lighter purple at top
      gradient.addColorStop(1, "#1A0E2E"); // Darker purple at bottom
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, this.HEADER_HEIGHT);
      headerGradientTexture.refresh();

      const headerGradient = this.add.image(
        width / 2,
        this.HEADER_HEIGHT / 2,
        "headerGradient"
      );
      headerGradient.setScrollFactor(0);
      headerGradient.setDepth(0);
      headerGradient.setDisplaySize(width, this.HEADER_HEIGHT);
    }

    // Level section (left side)
    const levelSectionWidth = width / 2;
    const levelSectionX = levelSectionWidth / 2;
    const levelSectionY = this.HEADER_HEIGHT / 2;

    // Level text - White text with black stroke
    this.levelText = this.add.text(
      levelSectionX,
      levelSectionY,
      `LEVEL ${this.currentLevel}`,
      {
        fontSize: "34px",
        color: "#FFFFFF",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        stroke: "#000000",
        strokeThickness: 6,
      }
    );
    this.levelText.setOrigin(0.5);
    this.levelText.setScrollFactor(0);

    // Score section (right side)
    const scoreSectionWidth = width / 2;
    const scoreSectionX = width - scoreSectionWidth / 2;
    const scoreSectionY = this.HEADER_HEIGHT / 2;

    // Score text - White text with black stroke
    this.scoreText = this.add.text(
      scoreSectionX,
      scoreSectionY,
      `SCORE: ${this.currentScore}`,
      {
        fontSize: "32px",
        color: "#FFFFFF",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        stroke: "#000000",
        strokeThickness: 6,
      }
    );
    this.scoreText.setOrigin(0.5);
    this.scoreText.setScrollFactor(0);

    // Create circular clock in the center
    this.createCircularClock();

    // Make game camera ignore all UI elements
    this.gameCamera.ignore([
      headerBg,
      this.levelText,
      this.scoreText,
      this.clockCircle,
      this.clockHand,
      this.clockFill,
    ]);

    // Create time bar - REMOVED, using circular clock instead
    // this.createTimeBar();
  }

  private createCircularClock() {
    const { width } = GameSettings.canvas;
    const centerX = width / 2;
    const centerY = this.HEADER_HEIGHT / 2 + 9; // Moved 9px down (was 8)
    const radius = 50;

    // Clock fill (arc that decreases)
    this.clockFill = this.add.graphics();
    this.clockFill.setScrollFactor(0);
    this.clockFill.setDepth(1);

    // Clock circle border
    this.clockCircle = this.add.graphics();
    this.clockCircle.setScrollFactor(0);
    this.clockCircle.setDepth(2);
    this.clockCircle.lineStyle(8, 0x000000, 1);
    this.clockCircle.strokeCircle(centerX, centerY, radius);

    // Clock hand (needle)
    this.clockHand = this.add.graphics();
    this.clockHand.setScrollFactor(0);
    this.clockHand.setDepth(3);

    this.updateCircularClock();
  }

  private updateCircularClock() {
    const { width } = GameSettings.canvas;
    const centerX = width / 2;
    const centerY = this.HEADER_HEIGHT / 2 + 9; // Moved 9px down (was 8)
    const radius = 50;

    // Clear previous drawings
    this.clockFill.clear();
    this.clockHand.clear();

    // Draw dark gray background circle first (empty space)
    this.clockFill.fillStyle(0x1a1a1a, 1); // Darker grayish background
    this.clockFill.fillCircle(centerX, centerY, radius - 4);

    // Calculate angle based on time remaining (starts at top, goes clockwise)
    // The hand should point to the end of the fill arc
    const fillAngle = this.timeRemaining * Math.PI * 2;
    const handAngle = -Math.PI / 2 + fillAngle; // Same as the end of the arc

    // Determine color based on time remaining
    let fillColor = 0x00ff88; // Green
    if (this.timeRemaining < 0.3) {
      fillColor = 0xff1744; // Red
    } else if (this.timeRemaining < 0.6) {
      fillColor = 0xf7ea48; // Yellow
    }

    // Draw colored fill arc on top of white background
    this.clockFill.fillStyle(fillColor, 1); // Changed to full opacity
    this.clockFill.beginPath();
    this.clockFill.moveTo(centerX, centerY);
    this.clockFill.arc(
      centerX,
      centerY,
      radius - 2,
      -Math.PI / 2,
      -Math.PI / 2 + fillAngle,
      false
    );
    this.clockFill.closePath();
    this.clockFill.fillPath();

    // Draw clock hand (needle) pointing to the end of the fill arc
    const handLength = radius - 6;
    const handX = centerX + Math.cos(handAngle) * handLength;
    const handY = centerY + Math.sin(handAngle) * handLength;

    this.clockHand.lineStyle(4, 0x000000, 1); // Increased thickness
    this.clockHand.beginPath();
    this.clockHand.moveTo(centerX, centerY);
    this.clockHand.lineTo(handX, handY);
    this.clockHand.strokePath();

    // Draw center dot
    this.clockHand.fillStyle(0x000000, 1);
    this.clockHand.fillCircle(centerX, centerY, 5); // Increased size
  }

  private createTimeBar() {
    const { width } = GameSettings.canvas;
    const barWidth = width - this.TIME_BAR_PADDING * 2;
    const barHeight = 30;

    // Time bar background - Just black border, transparent inside
    this.timeBarBackground = this.add.graphics();
    this.timeBarBackground.setScrollFactor(0);

    // Black border only (no fill)
    this.timeBarBackground.lineStyle(4, 0x000000, 1);
    this.timeBarBackground.strokeRoundedRect(
      this.TIME_BAR_PADDING,
      this.HEADER_HEIGHT + this.TIME_BAR_PADDING,
      barWidth,
      barHeight,
      15
    );

    // Time bar foreground (energy) - will be drawn on top with gradient
    this.timeBar = this.add.graphics();
    this.timeBar.setScrollFactor(0);
    // this.updateTimeBar(); // REMOVED - using circular clock instead

    // Make game camera ignore time bars
    this.gameCamera.ignore([this.timeBarBackground, this.timeBar]);
  }

  /*
  // REMOVED - using circular clock instead
  private updateTimeBar() {
    const { width } = GameSettings.canvas;
    const barWidth = width - this.TIME_BAR_PADDING * 2;
    const barHeight = 30;

    this.timeBar.clear();

    // Colors based on VeeFriends palette
    let color1, color2;

    if (this.timeRemaining > 0.5) {
      // Green (VeeFriends green like FOUND text)
      color1 = 0x00ff88;
      color2 = 0x00dd77;
    } else if (this.timeRemaining > 0.25) {
      // Yellow (VeeFriends yellow like header text)
      color1 = 0xf7ea48;
      color2 = 0xe5d830;
    } else {
      // Red (like GAME OVER and INCORRECT)
      color1 = 0xff1744;
      color2 = 0xdd1530;
    }

    // Draw gradient bar with rounded corners
    this.timeBar.fillGradientStyle(color1, color1, color2, color2, 1);
    this.timeBar.fillRoundedRect(
      this.TIME_BAR_PADDING + 2,
      this.HEADER_HEIGHT + this.TIME_BAR_PADDING + 2,
      (barWidth - 4) * this.timeRemaining,
      barHeight - 4,
      12
    );
  }
  */

  private setupControls() {
    // Pointer down - start drag only (no double tap zoom)
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.startDrag(pointer);
    });

    // Pointer move - drag camera
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.dragCamera(pointer);
      }
    });

    // Pointer up - stop drag
    this.input.on("pointerup", () => {
      this.stopDrag();
    });
  }

  private startDrag(pointer: Phaser.Input.Pointer) {
    this.isDragging = true;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
  }

  private dragCamera(pointer: Phaser.Input.Pointer) {
    const zoom = this.gameCamera.zoom;

    // Calculate delta movement
    const deltaX = (this.dragStartX - pointer.x) / zoom;
    const deltaY = (this.dragStartY - pointer.y) / zoom;

    // Update camera scroll
    this.gameCamera.scrollX += deltaX;
    this.gameCamera.scrollY += deltaY;

    // Clamp camera to prevent showing empty space
    this.clampCamera();

    // Update drag start position
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
  }

  private clampCamera() {
    const zoom = this.gameCamera.zoom;
    const { width, height } = GameSettings.canvas;
    const availableHeight = height - this.HEADER_HEIGHT;

    // Calculate the visible area in world coordinates
    const visibleWidth = width / zoom;
    const visibleHeight = availableHeight / zoom;

    // Get the actual image bounds (excluding the header offset)
    const bounds = this.gameCamera.getBounds();
    const imageWidth = bounds.width;
    const imageHeight = bounds.height - this.HEADER_HEIGHT;

    // Calculate max scroll positions to prevent showing black areas
    const maxScrollX = Math.max(0, imageWidth - visibleWidth);
    const maxScrollY = Math.max(0, imageHeight - visibleHeight);

    // Clamp camera position
    // X: from 0 to maxScrollX
    // Y: from HEADER_HEIGHT to HEADER_HEIGHT + maxScrollY
    this.gameCamera.scrollX = Phaser.Math.Clamp(
      this.gameCamera.scrollX,
      0,
      maxScrollX
    );
    this.gameCamera.scrollY = Phaser.Math.Clamp(
      this.gameCamera.scrollY,
      this.HEADER_HEIGHT,
      this.HEADER_HEIGHT + maxScrollY
    );
  }

  private stopDrag() {
    this.isDragging = false;
  }

  private startLevelTimer() {
    // Timer that decreases energy bar over time
    this.levelTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        this.timeRemaining -= 0.002; // Adjust for difficulty

        if (this.timeRemaining <= 0) {
          this.timeRemaining = 0;
          this.onTimeUp();
        }

        // this.updateTimeBar(); // REMOVED - using circular clock instead
        this.updateCircularClock();
      },
      loop: true,
    });
  }

  private onTimeUp() {
    console.log("Time is up!");
    // Handle game over logic
  }

  private updateScore(points: number) {
    this.currentScore += points;
    this.scoreText.setText(`SCORE: ${this.currentScore}`);
  }

  private updateLevel(level: number) {
    this.currentLevel = level;
    this.levelText.setText(`LEVEL ${this.currentLevel}`);
  }

  private goToNextLevel() {
    const maxLevel = 13; // Maximum level (we have 13 characters)

    if (this.currentLevel < maxLevel) {
      // Go to next level
      this.currentLevel++;
      console.log(`Advancing to Level ${this.currentLevel}`);

      // Restart scene with new level data
      this.scene.restart({
        currentLevel: this.currentLevel,
        currentScore: this.currentScore,
        foundCharacters: this.foundCharacters,
      });
    } else {
      // Completed all levels - Show victory screen or go back to main menu
      console.log("¡Congratulations! All levels completed!");
      // TODO: Show victory modal or return to main menu
      this.scene.start("MainScene");
    }
  }

  update() {
    // Game loop updates if needed
  }
}
