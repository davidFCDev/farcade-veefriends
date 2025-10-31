import { CharacterData, getAllCharacters } from "../config/CharactersData";
import GameSettings from "../config/GameSettings";

export class AlbumScene extends Phaser.Scene {
  private foundCharacters: Set<string> = new Set(); // IDs of found characters
  private currentCardIndex: number = 0;
  private allCharacters: CharacterData[] = [];
  private cardContainers: Phaser.GameObjects.Container[] = [];
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragDistance: number = 0;

  constructor() {
    super({ key: "AlbumScene" });
  }

  init(data: { foundCharacters?: Set<string> }) {
    // Receive found characters from previous scene
    if (data.foundCharacters) {
      this.foundCharacters = data.foundCharacters;
    }

    // For testing: Unlock all characters
    if (this.foundCharacters.size === 0) {
      const allCharacters = getAllCharacters();
      allCharacters.forEach((character) => {
        this.foundCharacters.add(character.id);
      });
    }
  }

  preload() {
    // Load WebFont for Chicle
    this.load.script(
      "webfont",
      "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
    );

    // Load album background image
    this.load.image(
      "album-background",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/fondo%20album-8mHOveFa44aNuM9zYgMTDmS1c6SA92.png"
    );

    // Load all character card images
    const characters = getAllCharacters();
    characters.forEach((character) => {
      this.load.image(`${character.id}-card`, character.cardImageUrl);
    });
  }

  create() {
    // Load Google Font Chicle before creating UI
    (window as any).WebFont.load({
      google: {
        families: ["Chicle"],
      },
      active: () => {
        this.initializeAlbum();
      },
    });
  }

  private initializeAlbum() {
    const { width, height } = GameSettings.canvas;

    // Get all characters and sort by level
    this.allCharacters = getAllCharacters().sort((a, b) => a.level - b.level);

    // Background gradient - VeeFriends purple style
    this.createGradientBackground();

    // Header with title and subtitle
    this.createHeader();

    // Card slider
    this.createCardSlider();

    // Back button
    this.createBackButton();
  }

  private createGradientBackground() {
    const { width, height } = GameSettings.canvas;

    // Add background image
    const background = this.add.image(
      width / 2,
      height / 2,
      "album-background"
    );

    // Calculate scale to cover the entire canvas
    const scaleX = width / background.width;
    const scaleY = height / background.height;

    // Use the larger scale to ensure it covers everything
    const scale = Math.max(scaleX, scaleY);

    background.setScale(scale);
    background.setDepth(0);
  }

  private createHeader() {
    const { width, height } = GameSettings.canvas;

    // Title position - relative to canvas height
    const titleY = height * 0.08; // 8% from top
    const subtitleY = height * 0.15; // 15% from top

    // Title - "ALBUM" in yellow with complete shadowing like MainScene
    const titleText = this.add.text(width / 2, titleY, "ALBUM", {
      fontSize: "96px", // Same as MainScene
      color: "#F7EA48", // VeeFriends yellow
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      align: "center",
      stroke: "#000000", // Black border
      strokeThickness: 10, // Same as MainScene
      wordWrap: { width: width - 40 }, // More padding to prevent text cutoff (was 100)
      shadow: {
        offsetX: 10,
        offsetY: 10,
        color: "#000000",
        blur: 0, // No blur for opaque shadow
        fill: true,
      },
    });
    titleText.setOrigin(0.5);

    // Subtitle - "Collect them all!" in black
    const subtitleText = this.add.text(
      width / 2,
      subtitleY,
      "Collect them all!",
      {
        fontSize: "38px",
        color: "#000000", // Black
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
      }
    );
    subtitleText.setOrigin(0.5);
  }

  private createCardSlider() {
    const { width, height } = GameSettings.canvas;

    // Clear previous containers
    this.cardContainers = [];

    // Card dimensions - relative to canvas size
    const cardWidth = width * 0.67; // 67% of canvas width (~480px on 720px canvas)
    const cardHeight = height * 0.67; // 67% of canvas height (~720px on 1080px canvas)
    const cardY = height * 0.55; // 55% from top (centered below header)

    // Create all character cards
    this.allCharacters.forEach((character, index) => {
      const cardContainer = this.createFullCharacterCard(
        character,
        width / 2,
        cardY,
        cardWidth,
        cardHeight
      );
      this.cardContainers.push(cardContainer);
    });

    // Position cards initially
    this.updateCardPositions(false);

    // Setup drag controls
    this.setupSliderControls();
  }

  private createFullCharacterCard(
    character: CharacterData,
    x: number,
    y: number,
    cardWidth: number,
    cardHeight: number
  ): Phaser.GameObjects.Container {
    const cardContainer = this.add.container(x, y);
    const shadowOffset = 12;

    // Check if character is unlocked
    const isUnlocked = this.foundCharacters.has(character.id);

    // Get personalized gradient for this character
    const characterGradient = this.getCharacterGradient(
      character.id,
      isUnlocked
    );

    // Shadow
    const shadowBg = this.add.graphics();
    shadowBg.fillStyle(0x000000, 0.7);
    shadowBg.fillRoundedRect(
      -cardWidth / 2 + shadowOffset,
      -cardHeight / 2 + shadowOffset,
      cardWidth,
      cardHeight,
      25
    );
    cardContainer.add(shadowBg);

    // Black border
    const borderBg = this.add.graphics();
    borderBg.lineStyle(8, 0x000000, 1);
    borderBg.strokeRoundedRect(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth,
      cardHeight,
      25
    );
    cardContainer.add(borderBg);

    // Create gradient background
    const gradientBg = this.add.graphics();
    const ctx = gradientBg.fillGradientStyle(
      parseInt(characterGradient.color1.replace("#", "0x")),
      parseInt(characterGradient.color1.replace("#", "0x")),
      parseInt(characterGradient.color2.replace("#", "0x")),
      parseInt(characterGradient.color2.replace("#", "0x")),
      1
    );
    gradientBg.fillRoundedRect(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth,
      cardHeight,
      25
    );
    cardContainer.add(gradientBg);

    // Character image - relative size
    const charImageSize = cardWidth * 0.854; // 85.4% of card width (~410px on 480px card)
    const charImageY = -cardHeight * 0.167; // 16.7% from center (~120px on 720px card)
    const charImage = this.add.image(0, charImageY, `${character.id}-card`);
    charImage.setDisplaySize(charImageSize, charImageSize);

    // Info box - relative dimensions (increased height for better spacing)
    const infoBoxHeight = cardHeight * 0.37; // Increased from 0.33 (33%) to 0.37 (37%)
    const infoBoxWidth = cardWidth * 0.875; // 87.5% of card width
    const infoBoxY = cardHeight / 2 - infoBoxHeight - cardHeight * 0.055; // 5.5% padding from bottom

    const infoBox = this.add.graphics();
    infoBox.lineStyle(8, 0xffffff, 1);
    infoBox.strokeRoundedRect(
      -infoBoxWidth / 2,
      infoBoxY,
      infoBoxWidth,
      infoBoxHeight,
      16
    );

    // Different background color for locked cards
    const infoBoxColor = isUnlocked ? 0x0c0b09 : 0x4a4a4a;
    infoBox.fillStyle(infoBoxColor, 1);
    infoBox.fillRoundedRect(
      -infoBoxWidth / 2,
      infoBoxY,
      infoBoxWidth,
      infoBoxHeight,
      16
    );
    cardContainer.add(infoBox);

    // Now add character image AFTER info box so it appears on top
    // If locked, create a silhouette effect
    if (!isUnlocked) {
      // Apply multiple effects for a true silhouette look
      // 1. Set to grayscale with very dark tint
      charImage.setTint(0x2a2a2a); // Very dark gray

      // 2. Reduce brightness and increase contrast
      charImage.setPipeline("Light2D");

      // 3. Create a mask effect using a render texture for solid silhouette
      const rt = this.add.renderTexture(
        0,
        charImageY,
        charImageSize,
        charImageSize
      );
      rt.setOrigin(0.5);

      // Draw the character image to render texture with dark tint
      const tempImage = this.add.image(
        charImageSize / 2,
        charImageSize / 2,
        `${character.id}-card`
      );
      tempImage.setDisplaySize(charImageSize, charImageSize);
      tempImage.setTint(0x404040); // Medium-dark gray for silhouette
      rt.draw(tempImage);
      tempImage.destroy();

      // Apply a solid color overlay to remove all color details
      rt.setTint(0x4a4a4a); // Solid gray tint

      // Remove original image and use the render texture instead
      charImage.destroy();
      cardContainer.add(rt);
    } else {
      cardContainer.add(charImage);
    }

    if (isUnlocked) {
      // "Who is" text - relative positioning (smaller, lowercase)
      const whoIsFontSize = cardHeight * 0.035; // 3.5% of card height (~25px on 720px card)
      const whoIsY = infoBoxY + infoBoxHeight * 0.15; // Near top with padding
      const whoIsText = this.add.text(0, whoIsY, "Who is", {
        fontSize: `${whoIsFontSize}px`,
        color: "#FFFFFF",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        align: "center",
        stroke: "#000000",
        strokeThickness: 3,
      });
      whoIsText.setOrigin(0.5);
      cardContainer.add(whoIsText);

      // Character name - relative positioning (larger, uppercase, yellow)
      const nameFontSize = cardHeight * 0.052; // 5.2% of card height (~37px on 720px card)
      const nameY = infoBoxY + infoBoxHeight * 0.32; // Below "Who is" with gap
      const nameLabel = this.add.text(0, nameY, character.name.toUpperCase(), {
        fontSize: `${nameFontSize}px`,
        color: "#F7EA48", // Yellow color
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        align: "center",
        stroke: "#000000",
        strokeThickness: 5,
        wordWrap: { width: infoBoxWidth * 0.91 }, // 91% of info box width
      });
      nameLabel.setOrigin(0.5);
      cardContainer.add(nameLabel);

      // Description for unlocked card - relative positioning and sizing (improved spacing)
      const descFontSize = cardHeight * 0.037; // 3.7% of card height (~27px on 720px card)
      const descY = infoBoxY + infoBoxHeight * 0.68; // Below name with consistent gap
      const descText = this.add.text(0, descY, character.description, {
        fontSize: `${descFontSize}px`,
        color: "#FFFFFF",
        fontFamily: "Chicle, cursive",
        fontStyle: "italic",
        align: "center",
        wordWrap: { width: infoBoxWidth * 0.88 }, // 88% of info box width
      });
      descText.setOrigin(0.5);
      cardContainer.add(descText);
    } else {
      // Locked message - relative positioning and sizing
      const lockedFontSize = cardHeight * 0.053; // 5.3% of card height (~38px on 720px card)
      const lockedY = infoBoxY + infoBoxHeight * 0.5; // Centered in info box
      const lockedText = this.add.text(
        0,
        lockedY,
        "You haven't unlocked\nthis yet",
        {
          fontSize: `${lockedFontSize}px`,
          color: "#CCCCCC",
          fontFamily: "Chicle, cursive",
          fontStyle: "normal",
          align: "center",
          wordWrap: { width: infoBoxWidth * 0.88 }, // 88% of info box width
        }
      );
      lockedText.setOrigin(0.5);
      cardContainer.add(lockedText);
    }

    // Level badge (only for unlocked cards) - relative dimensions
    if (isUnlocked) {
      const badgeRadius = cardWidth * 0.073; // 7.3% of card width (~35px on 480px card)
      const badgePadding = cardWidth * 0.042; // 4.2% of card width (~20px on 480px card)
      const badgeX = -cardWidth / 2 + badgeRadius + badgePadding;
      const badgeY = -cardHeight / 2 + badgeRadius + badgePadding;

      // White circle background
      const badgeBg = this.add.graphics();
      badgeBg.fillStyle(0xffffff, 1);
      badgeBg.fillCircle(badgeX, badgeY, badgeRadius);
      cardContainer.add(badgeBg);

      // Black border
      const badgeBorder = this.add.graphics();
      badgeBorder.lineStyle(6, 0x000000, 1); // Increased from 4 to 6
      badgeBorder.strokeCircle(badgeX, badgeY, badgeRadius);
      cardContainer.add(badgeBorder);

      // Level number (always 1 for now, can be dynamic later)
      const levelNumber = this.add.text(badgeX, badgeY, "1", {
        fontSize: `${badgeRadius * 1.37}px`, // ~48px for 35px radius
        color: "#F7EA48", // Yellow fill
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        stroke: "#000000", // Black border
        strokeThickness: 7, // Increased from 5 to 7
      });
      levelNumber.setOrigin(0.5);
      cardContainer.add(levelNumber);
    }

    return cardContainer;
  }

  private updateCardPositions(animated: boolean = true) {
    const { width } = GameSettings.canvas;
    const centerX = width / 2;
    const cardSpacing = width * 0.583; // 58.3% of canvas width (~420px on 720px canvas)

    this.cardContainers.forEach((container, index) => {
      const offset = index - this.currentCardIndex;
      const targetX = centerX + offset * cardSpacing;
      const targetScale = offset === 0 ? 1 : 0.75; // Center card full size, adjacent cards 75%
      const targetAlpha = Math.abs(offset) <= 1 ? 1 : 0; // Only show current and adjacent cards

      if (animated) {
        this.tweens.add({
          targets: container,
          x: targetX,
          scale: targetScale,
          alpha: targetAlpha,
          duration: 300,
          ease: "Power2",
        });
      } else {
        container.setPosition(targetX, container.y);
        container.setScale(targetScale);
        container.setAlpha(targetAlpha);
      }
    });
  }

  private setupSliderControls() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragDistance = 0;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.dragDistance = pointer.x - this.dragStartX;
      }
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const { width } = GameSettings.canvas;
        const centerX = width / 2;
        const clickX = pointer.x;
        const clickThreshold = width * 0.208; // 20.8% of canvas width (~150px on 720px canvas)
        const swipeThreshold = width * 0.111; // 11.1% of canvas width (~80px on 720px canvas)

        // Check if it's a drag or a click
        if (Math.abs(this.dragDistance) < 10) {
          // It's a click, check which card was clicked
          // Left card zone
          if (clickX < centerX - clickThreshold) {
            this.previousCard();
          }
          // Right card zone
          else if (clickX > centerX + clickThreshold) {
            this.nextCard();
          }
          // Center card - do nothing or could add a modal/details view later
        } else {
          // It's a swipe
          if (this.dragDistance > swipeThreshold) {
            this.previousCard();
          } else if (this.dragDistance < -swipeThreshold) {
            this.nextCard();
          }
        }

        this.isDragging = false;
        this.dragDistance = 0;
      }
    });
  }

  private nextCard() {
    if (this.currentCardIndex < this.allCharacters.length - 1) {
      this.currentCardIndex++;
      this.updateCardPositions(true);
    }
  }

  private previousCard() {
    if (this.currentCardIndex > 0) {
      this.currentCardIndex--;
      this.updateCardPositions(true);
    }
  }

  private getCharacterGradient(
    characterId: string,
    isUnlocked: boolean = true
  ): {
    color1: string;
    color2: string;
  } {
    // If locked, return grayscale gradient
    if (!isUnlocked) {
      return { color1: "#B0B0B0", color2: "#505050" }; // Light gray to dark gray
    }

    // Gradientes personalizados para cada personaje basados en las cartas oficiales
    const gradients: { [key: string]: { color1: string; color2: string } } = {
      "graceful-goldfish": { color1: "#F7EA48", color2: "#FF8A6B" }, // Yellow to coral/orange
      "alpha-alligator": { color1: "#00D4FF", color2: "#0066CC" }, // Light blue to dark blue
      "brilliant-barb": { color1: "#FF69B4", color2: "#FF1493" }, // Light pink to deep pink
      "cynical-cat": { color1: "#FFD700", color2: "#FF6347" }, // Gold to tomato
      "bad-intentions": { color1: "#8B4513", color2: "#2F1810" }, // Brown to dark brown
      "gritty-ghost": { color1: "#9B59B6", color2: "#2C3E50" }, // Purple to dark slate
      "curious-crane": { color1: "#87CEEB", color2: "#4682B4" }, // Sky blue to steel blue
      "dumbo-octopus": { color1: "#DDA0DD", color2: "#9370DB" }, // Plum to medium purple
      "happy-hermit": { color1: "#FFB6C1", color2: "#FF69B4" }, // Light pink to hot pink
      "jolly-jack-o": { color1: "#FFA500", color2: "#FF4500" }, // Orange to orange-red
      "forever-phoenix": { color1: "#FF6347", color2: "#8B0000" }, // Tomato to dark red
      "motivated-monster": { color1: "#32CD32", color2: "#006400" }, // Lime green to dark green
      "shrewd-sheep": { color1: "#E67E22", color2: "#D35400" }, // Carrot orange to pumpkin
      "notorious-ninja": { color1: "#4B0082", color2: "#000000" }, // Indigo to black
      "pleasant-platypus": { color1: "#8B4513", color2: "#654321" }, // Saddle brown to dark brown
    };

    return gradients[characterId] || { color1: "#4A2B7C", color2: "#1A0E2E" }; // Default purple gradient
  }

  private createBackButton() {
    const { width, height } = GameSettings.canvas;

    // Relative dimensions
    const buttonWidth = width * 0.278; // 27.8% of canvas width (~200px on 720px canvas)
    const buttonHeight = height * 0.056; // 5.6% of canvas height (~60px on 1080px canvas)
    const buttonX = width / 2;
    const buttonY = height * 0.955; // Moved down from 92.6% to 95.5% for better separation from cards
    const shadowOffset = 8;

    const buttonBg = this.add.graphics();

    // Black shadow
    buttonBg.fillStyle(0x000000, 1);
    buttonBg.fillRoundedRect(
      buttonX - buttonWidth / 2 + shadowOffset,
      buttonY - buttonHeight / 2 + shadowOffset,
      buttonWidth,
      buttonHeight,
      12
    );

    // Black border
    buttonBg.lineStyle(8, 0x000000, 1);
    buttonBg.strokeRoundedRect(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      12
    );

    // Yellow background (changed from purple)
    buttonBg.fillStyle(0xf7ea48, 1);
    buttonBg.fillRoundedRect(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      12
    );

    const backText = this.add.text(buttonX, buttonY, "BACK", {
      fontSize: "32px",
      color: "#000000", // Changed to black for yellow background
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
    });
    backText.setOrigin(0.5);

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

    // Back button handler
    buttonZone.on("pointerdown", () => {
      this.scene.start("MainScene");
    });
  }
}
