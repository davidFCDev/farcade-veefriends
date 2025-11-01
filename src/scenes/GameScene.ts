import {
  CharacterData,
  getAllCharacters,
  getCharactersByLevel,
} from "../config/CharactersData";
import GameSettings from "../config/GameSettings";
import GameStateManager from "../utils/GameStateManager";
import MenuMusicController from "../utils/MenuMusicController";

export class GameScene extends Phaser.Scene {
  private static lastLevelMusicKey: string | null = null;
  private static sharedLevelMusic?: Phaser.Sound.BaseSound;
  private static activeScene?: GameScene;
  // Cameras
  private gameCamera!: Phaser.Cameras.Scene2D.Camera;
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;

  // UI Elements
  private header!: Phaser.GameObjects.Container;
  private timeBar!: Phaser.GameObjects.Graphics;
  private timeBarBackground!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private clockCircle!: Phaser.GameObjects.Graphics;
  private clockHand!: Phaser.GameObjects.Graphics;
  private clockFill!: Phaser.GameObjects.Graphics;
  private timeBoxGraphics!: Phaser.GameObjects.Graphics;
  private timeBoxX!: number;
  private timeBoxY!: number;
  private timeBoxWidth!: number;
  private timeBoxHeight!: number;
  private scrollIndicatorElements: Phaser.GameObjects.GameObject[] = [];
  private scrollIndicatorTween?: Phaser.Tweens.Tween;

  // Game Map
  private mapContainer!: Phaser.GameObjects.Container;
  private mapBackground!: Phaser.GameObjects.Rectangle;
  private mapWidth: number = 0;
  private mapHeight: number = 0;

  // Character to find
  private characterSprites: Phaser.GameObjects.Image[] = [];
  private currentCharacter!: CharacterData; // Current character data for this level
  private currentCharacters: CharacterData[] = []; // Unique characters targeted this level
  private characterInstances: CharacterData[] = []; // Character list including duplicates for placement
  private targetRequirements: Map<string, number> = new Map(); // Required finds per character ID
  private targetProgress: Map<string, number> = new Map(); // Progress of finds per character ID
  private totalTargetsToFind: number = 0; // Total instances to locate this level
  private totalTargetsFound: number = 0; // Total instances already found
  private foundCharacters: Set<string> = new Set(); // IDs of found characters (for album)
  // characterLevels removed - no longer tracking levels per character

  // Camera Controls
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragStartScrollX: number = 0;
  private dragStartScrollY: number = 0;
  private lastTapTime: number = 0;
  private doubleTapDelay: number = 300; // ms
  private minZoom: number = 1;
  private maxZoom: number = 3;
  private initialZoom: number = 1.5;
  private isModalOpen: boolean = false;

  // Character click tracking
  private lastClickedCharacter: Phaser.GameObjects.Image | null = null;
  private lastClickTime: number = 0;
  private doubleTapThreshold: number = 400; // ms for double tap detection

  // Game State
  private currentLevel: number = 1;
  private currentScore: number = 0;
  private currentCoins: number = 0;
  private strikes: number = 0;
  private maxStrikes: number = 1; // Un solo error = Game Over
  private timeRemaining: number = 1; // 0 to 1 (100%)
  private timeRemainingSeconds: number = 60; // Tiempo en segundos
  private levelTimer?: Phaser.Time.TimerEvent; // Timer for level countdown
  private initialTimeSeconds: number = 15;
  private pointsEarnedThisLevel: number = 0;
  private successSoundToggle: number = 0;
  private levelMusic?: Phaser.Sound.BaseSound;

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
    currentCoins?: number;
    foundCharacters?: Set<string>;
  }) {
    // Restore level, score, coins, and found characters ONLY within current game session
    // When starting from MainScene (play_again or fresh start), these will be undefined
    if (data.currentLevel !== undefined) {
      this.currentLevel = data.currentLevel;
    } else {
      // Always start from level 1 when coming from MainScene or play_again
      this.currentLevel = 1;
    }
    if (data.currentScore !== undefined) {
      this.currentScore = data.currentScore;
    }
    if (data.currentCoins !== undefined) {
      this.currentCoins = data.currentCoins;
    } else {
      // If starting fresh (no currentCoins passed), load from game state
      const stateManager = GameStateManager.getInstance();
      this.currentCoins = stateManager.getCoins();
    }
    if (data.foundCharacters !== undefined) {
      this.foundCharacters = data.foundCharacters;
    }
    // characterLevels removed - no longer tracking levels per character

    // Reset game state for new level
    this.strikes = 0;
    this.timeRemaining = 1;
    this.isModalOpen = false;
    const baseLevel = ((this.currentLevel - 1) % 13) + 1;
    // Each round resets to 15s and decreases to 10s based on the base level within the cycle
    this.timeRemainingSeconds = Math.max(10, 16 - baseLevel);
    this.initialTimeSeconds = this.timeRemainingSeconds;
    this.pointsEarnedThisLevel = 0;
    this.successSoundToggle = 0;
    this.isDragging = false;
    this.targetProgress = new Map();
    this.targetRequirements = new Map();
    this.characterInstances = [];
    this.totalTargetsToFind = 0;
    this.totalTargetsFound = 0;

    // Reset double tap tracking
    this.lastClickedCharacter = null;
    this.lastClickTime = 0;
  }

  preload() {
    // Load WebFont for Chicle
    this.load.script(
      "webfont",
      "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
    );

    // Load modal background image (WebP for faster loading)
    this.load.image(
      "modal-background",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/fondo-textura-DUv1xwl3LH3zlOf4D4mACjNtBrTSET.webp"
    );

    // Load UI sounds
    this.load.audio(
      "sfx-button",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/button-glDsBe370knE7WctxtYObJCunwLy2N.mp3?3wMr"
    );
    this.load.audio(
      "sfx-success",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/success-q7LZE7yGV3WwlwYyAercgz9LpIvxdy.mp3?SvhS"
    );
    this.load.audio(
      "sfx-success-alt",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/yipee-45360-HUnhPJGxkpR2MY4utcGSZW30ONbcxc.mp3?5N4z"
    );

    this.load.audio(
      "bgm-level-1",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/1-LnfELfIKB3GpHXk9TzOBeeHdkDbOCC.mp3?FPqf"
    );
    this.load.audio(
      "bgm-level-2",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/2-QpscZ9aHyurQA5ad2N4fNSFu1G52UX.mp3?gous"
    );
    this.load.audio(
      "bgm-level-3",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/3-IAudBTTWQreZzjXRWoCca1d83HbuZA.mp3?hxwx"
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
    // Map backgrounds for each level (1-13) - WebP for faster loading
    const levelMaps = [
      {
        level: 1,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/Level1-I9ORXcMbJ8pPg7SmzEX6DnHLWJ5PR0.webp",
      },
      {
        level: 2,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/Level2-0kWJ0Etxe6f4OI4kVgQprbrciniojQ.webp",
      },
      {
        level: 3,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/Level3-uM5DSXA3uEb5X7Uj2OCONlG9dVPRqK.webp",
      },
      {
        level: 4,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/level4-ohVtkjP4RgMJSZBgAyCLXB0ocATD9Y.webp",
      },
      {
        level: 5,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/level5-tyffBgETZSSK6J3zSqob6ywo7QajFu.webp",
      },
      {
        level: 6,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/level6-InhtE3r2WRPev4ETqbX2EhWScDswba.webp",
      },
      {
        level: 7,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/level7-e5pFyo73B4fEgaxmiI5nPexxk5aLmW.webp",
      },
      {
        level: 8,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/level8-mhMuzK37HiHcZaCiNmq8mR4JL1N3c5.webp",
      },
      {
        level: 9,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/level9-IwGDunaqYVY08Fqr2jod0WWiN4pFF3.webp",
      },
      {
        level: 10,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/level10-k2KR4hhOQ3IYkYlocATDi14muNV80O.webp",
      },
      {
        level: 11,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/level11-tOOCRGfuJ7MztS3keP8IgOwROWWLE5.webp",
      },
      {
        level: 12,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/level12-U6SzoTi5LXEnmk3H3OKaRddnbqlgb3.webp",
      },
      {
        level: 13,
        url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/level13-YwiVXmUDf44At72aoq9Bo2jac0RAUz.webp",
      },
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

    GameScene.activeScene = this;
    this.stopMenuMusic();
    this.startLevelMusic();

    // Ensure UI helpers are cleaned up on scene shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroyScrollIndicator();
      if (GameScene.activeScene === this) {
        GameScene.activeScene = undefined;
      }
    });

    // Load character for current level
    this.loadCurrentLevelCharacter();

    // Setup cameras first
    this.setupCameras();

    // Create the map container
    this.createMap();

    // Create UI (fixed to UI camera)
    this.createUI();

    // Add subtle indicator for horizontal exploration
    this.createScrollIndicator();

    // Setup input controls
    this.setupControls();

    // Show initial modal with character to find
    this.showCharacterIntroModal();
  }

  private loadCurrentLevelCharacter() {
    // Calculate how many characters to find based on level progression
    const allCharacters = getAllCharacters();
    const totalCharacters = allCharacters.length;

    if (totalCharacters === 0) {
      console.error("No characters available to load for the game scene.");
      this.currentCharacters = [];
      this.characterInstances = [];
      this.targetRequirements = new Map();
      this.targetProgress = new Map();
      this.totalTargetsToFind = 0;
      this.totalTargetsFound = 0;
      return;
    }

    const charactersToFind = Math.max(
      1,
      Math.min(Math.floor((this.currentLevel - 1) / 13) + 1, totalCharacters)
    );

    // Determine which level we are emulating (cycles every 13 levels)
    const baseLevel = ((this.currentLevel - 1) % 13) + 1;

    // Prefer characters from the base level; fall back to the global roster if missing
    const levelCharacters = getCharactersByLevel(baseLevel);
    const pool = levelCharacters.length > 0 ? levelCharacters : allCharacters;

    const instances: CharacterData[] = [];
    for (let index = 0; index < charactersToFind; index++) {
      instances.push(pool[index % pool.length]);
    }

    this.characterInstances = instances;
    this.totalTargetsToFind = instances.length;
    this.totalTargetsFound = 0;

    // Unique characters for UI references
    const uniqueMap = new Map<string, CharacterData>();
    instances.forEach((char) => {
      if (!uniqueMap.has(char.id)) {
        uniqueMap.set(char.id, char);
      }
    });
    this.currentCharacters = Array.from(uniqueMap.values());
    this.currentCharacter = instances[0];

    // Build requirement and progress maps
    this.targetRequirements = new Map();
    instances.forEach((char) => {
      const current = this.targetRequirements.get(char.id) ?? 0;
      this.targetRequirements.set(char.id, current + 1);
    });
    this.targetProgress = new Map();

    const summary = Array.from(this.targetRequirements.entries())
      .map(([id, count]) => {
        const characterName = uniqueMap.get(id)?.name ?? id;
        return count > 1 ? `${characterName} x${count}` : characterName;
      })
      .join(", ");
  }

  private setupCameras() {
    const { width, height } = GameSettings.canvas;

    // Main camera shows only the gameplay area (below the header)
    // This is the ONLY config that renders the full width correctly
    this.gameCamera = this.cameras.main;
    this.gameCamera.setViewport(
      0,
      this.HEADER_HEIGHT,
      width,
      height - this.HEADER_HEIGHT
    );
    this.gameCamera.setScroll(0, 0);
    this.gameCamera.setRoundPixels(false);

    // CRITICAL: Override culling rectangle to use full canvas width
    // This fixes the bug where viewport offset causes right-edge culling
    const originalUpdateCull = (this.gameCamera as any).cull.bind(
      this.gameCamera
    );
    (this.gameCamera as any).cull = function (renderables: any[]) {
      // Don't cull anything - render everything
      return renderables;
    };

    // Default zoom limits
    this.minZoom = 1;
    this.maxZoom = 3;
    this.gameCamera.setZoom(this.initialZoom || 1);

    // UI camera renders the full screen (header + overlays)
    this.uiCamera = this.cameras.add(0, 0, width, height);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.setZoom(1);

    // Ensure UI camera starts without ignored objects (they'll be added later)
    this.uiCamera.ignore([]);
  }

  private createMap() {
    // Create container for all map elements (world coordinates start at 0,0)
    this.mapContainer = this.add.container(0, 0);

    // Calculate base level for map (cycle through 1-13)
    const baseLevel = ((this.currentLevel - 1) % 13) + 1;

    // Create map background image using base level
    const mapKey = `level-${baseLevel}-bg`;
    const mapImage = this.add.image(0, 0, mapKey);
    mapImage.setOrigin(0, 0);
    mapImage.setDepth(-1);
    mapImage.setScrollFactor(1);
    mapImage.setVisible(true);

    // Make sure UI camera ignores the map
    this.uiCamera.ignore(mapImage);

    // Get actual image dimensions
    const imageWidth = mapImage.width;
    const imageHeight = mapImage.height;
    this.mapWidth = imageWidth;
    this.mapHeight = imageHeight;
    this.mapContainer.setSize(imageWidth, imageHeight);

    // Calculate zoom so the map always fills the gameplay height (below the header)
    const { width, height } = GameSettings.canvas;
    const availableHeight = height - this.HEADER_HEIGHT;

    // Calculate scale needed to fill width and height
    const scaleX = width / imageWidth;
    const scaleY = availableHeight / imageHeight;

    // Always use scaleY to guarantee full height coverage (no black bars at bottom)
    const calculatedMinZoom = scaleY;

    // Set initial zoom
    this.initialZoom = calculatedMinZoom;

    // Allow zoom from minimum to 3x
    this.minZoom = calculatedMinZoom;
    this.maxZoom = 3;

    // Update game camera bounds to the map size (simple bounds at 0,0)
    this.gameCamera.setBounds(0, 0, imageWidth, imageHeight);
    this.gameCamera.useBounds = true;

    // Apply zoom before positioning the camera
    this.gameCamera.setZoom(this.initialZoom);

    // Center the camera on the map
    this.gameCamera.centerOn(imageWidth / 2, imageHeight / 2);

    this.mapContainer.add(mapImage);

    // Make sure UI camera ignores the map container
    this.uiCamera.ignore(this.mapContainer);

    // Place characters on the map
    this.placeCharactersOnMap(imageWidth, imageHeight);

    // Position the camera at a random spot to start the level
    this.positionCameraForLevelStart(imageWidth, imageHeight);
  }

  private placeCharactersOnMap(mapWidth: number, mapHeight: number) {
    // Dynamically size characters so they remain visible across different map resolutions
    const characterSizeBase = Math.min(mapWidth, mapHeight) * 0.09; // Slightly reduced from 10% for better balance
    const characterSize = Phaser.Math.Clamp(characterSizeBase, 220, 420);
    const padding = 200;
    const occupiedPositions: Phaser.Math.Vector2[] = [];

    // Clear any existing characters
    this.characterSprites = [];

    // Place all character instances (including duplicates) for this level
    this.characterInstances.forEach((character) => {
      const sprite = this.createCharacterAtRandomPosition(
        `${character.id}-map`,
        character.id,
        mapWidth,
        mapHeight,
        characterSize,
        padding,
        occupiedPositions
      );
      occupiedPositions.push(new Phaser.Math.Vector2(sprite.x, sprite.y));
    });
  }

  private focusCameraOnPrimaryTarget(mapWidth: number, mapHeight: number) {
    if (this.currentCharacters.length === 0) {
      return;
    }

    const primaryId = this.currentCharacters[0]?.id;
    if (!primaryId) {
      return;
    }

    const targetSprite = this.characterSprites.find((sprite) => {
      return sprite.getData("characterId") === primaryId;
    });

    if (!targetSprite) {
      return;
    }

    const cam = this.gameCamera;
    cam.preRender();

    const visibleWidth = cam.displayWidth;
    const visibleHeight = cam.displayHeight;
    const currentView = new Phaser.Geom.Rectangle(
      cam.scrollX,
      cam.scrollY,
      visibleWidth,
      visibleHeight
    );

    if (currentView.contains(targetSprite.x, targetSprite.y)) {
      // Target is already visible after the initial centering on the map.
      return;
    }

    const halfVisibleWidth = visibleWidth / 2;
    const halfVisibleHeight = visibleHeight / 2;

    const effectiveMapWidth = this.mapWidth || mapWidth;
    const effectiveMapHeight = this.mapHeight || mapHeight;
    const targetX = Phaser.Math.Clamp(
      targetSprite.x,
      halfVisibleWidth,
      Math.max(halfVisibleWidth, effectiveMapWidth - halfVisibleWidth)
    );
    const targetY = Phaser.Math.Clamp(
      targetSprite.y,
      halfVisibleHeight,
      Math.max(halfVisibleHeight, effectiveMapHeight - halfVisibleHeight)
    );

    this.gameCamera.centerOn(targetX, targetY);
    this.clampCamera();
  }

  private positionCameraForLevelStart(mapWidth: number, mapHeight: number) {
    const cam = this.gameCamera;
    cam.preRender();

    const visibleWidth = cam.displayWidth;
    const visibleHeight = cam.displayHeight;
    const halfVisibleWidth = visibleWidth / 2;
    const halfVisibleHeight = visibleHeight / 2;

    const effectiveMapWidth = this.mapWidth || mapWidth;
    const effectiveMapHeight = this.mapHeight || mapHeight;

    const minX = halfVisibleWidth;
    const maxX = Math.max(
      halfVisibleWidth,
      effectiveMapWidth - halfVisibleWidth
    );
    const minY = halfVisibleHeight;
    const maxY = Math.max(
      halfVisibleHeight,
      effectiveMapHeight - halfVisibleHeight
    );

    const attempts = 25;
    let finalX = mapWidth / 2;
    let finalY = mapHeight / 2;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const candidateX = Phaser.Math.FloatBetween(minX, maxX);
      const candidateY = Phaser.Math.FloatBetween(minY, maxY);

      const candidateView = new Phaser.Geom.Rectangle(
        candidateX - halfVisibleWidth,
        candidateY - halfVisibleHeight,
        visibleWidth,
        visibleHeight
      );

      const targetVisible = this.characterSprites.some((sprite) => {
        const characterId = sprite.getData("characterId");
        return (
          this.targetRequirements.has(characterId) &&
          candidateView.contains(sprite.x, sprite.y)
        );
      });

      if (!targetVisible || attempt === attempts - 1) {
        finalX = candidateX;
        finalY = candidateY;
        break;
      }
    }

    this.gameCamera.centerOn(finalX, finalY);
    this.clampCamera();
  }

  private createCharacterAtRandomPosition(
    poseKey: string,
    characterId: string,
    mapWidth: number,
    mapHeight: number,
    size: number,
    padding: number,
    occupiedPositions: Phaser.Math.Vector2[]
  ): Phaser.GameObjects.Image {
    // Ajustar padding para mapas pequeños (evita rangos inválidos)
    const effectivePaddingX = Math.min(padding, Math.max(mapWidth * 0.2, 40));
    const effectivePaddingY = Math.min(padding, Math.max(mapHeight * 0.2, 40));

    // WORKAROUND: Exclude right-edge dead zone (500px) where Phaser culling cuts off rendering
    const rightDeadZone = 500;

    // Evitar el centro exacto para que el jugador tenga que explorar
    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;
    const excludeZoneWidth = mapWidth * 0.25;
    const excludeZoneHeight = mapHeight * 0.25;

    const halfSize = size / 2;
    const minX = Math.min(
      Math.max(effectivePaddingX + halfSize, halfSize),
      mapWidth - halfSize
    );
    // CRITICAL: Limit maxX to avoid right-edge dead zone
    const maxX = Math.max(
      minX,
      Math.min(
        mapWidth - effectivePaddingX - halfSize,
        mapWidth - rightDeadZone // Don't place characters in last 500px
      )
    );
    const minY = Math.min(
      Math.max(effectivePaddingY + halfSize, halfSize),
      mapHeight - halfSize
    );
    const maxY = Math.max(minY, mapHeight - effectivePaddingY - halfSize);

    const minimumSpacing = size * 0.75;

    let x = centerX;
    let y = centerY;
    let validPositionFound = false;

    for (let attempts = 0; attempts < 100; attempts++) {
      const candidateX = Phaser.Math.Between(
        Math.floor(minX),
        Math.floor(maxX)
      );
      const candidateY = Phaser.Math.Between(
        Math.floor(minY),
        Math.floor(maxY)
      );

      const isOutsideCenterZone =
        candidateX < centerX - excludeZoneWidth / 2 ||
        candidateX > centerX + excludeZoneWidth / 2 ||
        candidateY < centerY - excludeZoneHeight / 2 ||
        candidateY > centerY + excludeZoneHeight / 2;

      const isFarFromOthers = occupiedPositions.every((position) => {
        return (
          Phaser.Math.Distance.Between(
            candidateX,
            candidateY,
            position.x,
            position.y
          ) > minimumSpacing
        );
      });

      if (isOutsideCenterZone && isFarFromOthers) {
        x = candidateX;
        y = candidateY;
        validPositionFound = true;
        break;
      }
    }

    // Si no encontramos una posición válida tras varios intentos, usamos una posición de respaldo
    if (!validPositionFound) {
      const fallbackPositions = [
        {
          x: Phaser.Math.Clamp(centerX, minX, maxX),
          y: Phaser.Math.Clamp(centerY, minY, maxY),
        },
        { x: minX, y: Phaser.Math.Clamp(centerY, minY, maxY) },
        { x: maxX, y: Phaser.Math.Clamp(centerY, minY, maxY) },
        { x: Phaser.Math.Clamp(centerX, minX, maxX), y: minY },
        { x: Phaser.Math.Clamp(centerX, minX, maxX), y: maxY },
      ];

      const availableFallback = fallbackPositions.find((position) => {
        return occupiedPositions.every((existing) => {
          return (
            Phaser.Math.Distance.Between(
              position.x,
              position.y,
              existing.x,
              existing.y
            ) >
            minimumSpacing * 0.6
          );
        });
      });

      if (availableFallback) {
        x = availableFallback.x;
        y = availableFallback.y;
      } else {
        x = Phaser.Math.Clamp(centerX, minX, maxX);
        y = Phaser.Math.Clamp(centerY + mapHeight * 0.2, minY, maxY);
      }
    }

    // Create character sprite (back to 0,0 coordinates)
    const character = this.add.image(x, y, poseKey);
    if (!character.width || !character.height) {
      console.warn(
        `Character ${characterId} has invalid dimensions. Using fallback size.`
      );
      character.setDisplaySize(size, size);
    } else {
      character.setDisplaySize(size, size);
    }
    character.setInteractive();
    character.setData("characterId", characterId); // Store character ID
    character.setData("poseKey", poseKey);
    character.setDepth(10);

    // Add click handler
    character.on("pointerdown", () => this.onCharacterClick(character));

    // Add to map container
    this.mapContainer.add(character);
    this.characterSprites.push(character);

    // Make UI camera ignore the character
    this.uiCamera.ignore(character);
    return character;
  }

  private onCharacterClick(character: Phaser.GameObjects.Image) {
    const currentTime = Date.now();

    // Check for double tap
    const isDoubleTap =
      this.lastClickedCharacter === character &&
      currentTime - this.lastClickTime < this.doubleTapThreshold;

    // Update tracking
    this.lastClickedCharacter = character;
    this.lastClickTime = currentTime;

    // Only process on double tap
    if (!isDoubleTap) {
      return;
    }

    const characterId = character.getData("characterId");
    const requiredCount = this.targetRequirements.get(characterId) ?? 0;
    const foundCount = this.targetProgress.get(characterId) ?? 0;
    const remainingForCharacter = Math.max(requiredCount - foundCount, 0);
    const isTarget = requiredCount > 0;
    const alreadyFoundAllCopies = remainingForCharacter === 0;
    if (isTarget && !alreadyFoundAllCopies) {
      // STOP THE TIMER immediately
      if (this.levelTimer) {
        this.levelTimer.paused = true;
      }

      // Mark progress for this character instance
      this.targetProgress.set(characterId, foundCount + 1);
      this.totalTargetsFound++;
      this.foundCharacters.add(characterId); // Add to album collection

      const remainingTargets = Math.max(
        this.totalTargetsToFind - this.totalTargetsFound,
        0
      );

      this.playSuccessCue(remainingTargets);

      this.awardPointsForSuccessfulFind();

      // Haptic feedback for finding character
      if (typeof window !== "undefined" && (window as any).FarcadeSDK) {
        (window as any).FarcadeSDK.singlePlayer.actions.hapticFeedback();
      }

      // Hide the character
      character.setVisible(false);
      character.disableInteractive();

      // Check if all characters are found
      if (this.totalTargetsFound >= this.totalTargetsToFind) {
        // All characters found!
        this.showFoundModal();
      } else {
        // More characters to find - show quick feedback
        this.showQuickFoundFeedback(remainingTargets);
      }
    } else if (alreadyFoundAllCopies) {
      // No penalty for clicking an already found character
    } else {
      this.addStrike();
    }
  }

  private awardPointsForSuccessfulFind(): number {
    const basePoints = 100;
    const denominator = Math.max(1, this.initialTimeSeconds);
    const ratio = Phaser.Math.Clamp(
      this.timeRemainingSeconds / denominator,
      0,
      1
    );
    const timeMultiplier = Phaser.Math.Linear(1, 4, ratio);
    const totalPoints = Math.round(basePoints * timeMultiplier);

    this.pointsEarnedThisLevel += totalPoints;
    this.updateScore(totalPoints);

    return totalPoints;
  }

  private addStrike() {
    this.strikes++;

    // Haptic feedback for strike/error
    if (typeof window !== "undefined" && (window as any).FarcadeSDK) {
      (window as any).FarcadeSDK.singlePlayer.actions.hapticFeedback();
    }

    if (this.strikes >= this.maxStrikes) {
      // Game Over - handled by SDK
      console.log("Game Over: Max strikes reached");

      // Stop all music
      this.sound.stopAll();

      // Call SDK gameOver
      if (typeof window !== "undefined" && (window as any).FarcadeSDK) {
        (window as any).FarcadeSDK.singlePlayer.actions.gameOver({
          score: this.currentScore,
        });
        console.log(
          "Farcade SDK: Game Over called with score:",
          this.currentScore
        );
      }
    } else {
      // TODO: Show visual feedback for strike
      this.showStrikeFeedback();
    }
  }

  private showQuickFoundFeedback(remainingTargets: number) {
    if (remainingTargets <= 0) {
      return;
    }

    const { width, height } = GameSettings.canvas;

    const outline = this.add.text(width / 2, height / 2, "One more left...", {
      fontSize: "68px",
      color: "#00FF88",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000",
      strokeThickness: 14,
    });
    outline.setOrigin(0.5);
    outline.setScrollFactor(0);
    outline.setDepth(199);
    outline.setAlpha(0);

    const text = this.add.text(width / 2, height / 2, "One more left...", {
      fontSize: "68px",
      color: "#00FF88",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#FFFFFF",
      strokeThickness: 8,
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(200);
    text.setAlpha(0);

    this.gameCamera.ignore([outline, text]);

    this.tweens.add({
      targets: [outline, text],
      alpha: 1,
      scale: 1,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({
            targets: [outline, text],
            alpha: 0,
            scale: 0.95,
            duration: 220,
            ease: "Quad.easeIn",
            onComplete: () => {
              outline.destroy();
              text.destroy();

              if (this.levelTimer) {
                this.levelTimer.paused = false;
              }
            },
          });
        });
      },
    });
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

  private onCharacterClick_old(index: number) {
    console.log("¡Personaje encontrado!");
    this.showFoundModal();
  }

  private showCharacterIntroModal() {
    const { width, height } = GameSettings.canvas;
    const uniqueCharacterCount = this.currentCharacters.length;
    const hasMultipleTargets = this.totalTargetsToFind > 1;

    this.isModalOpen = true;

    if (uniqueCharacterCount === 0) {
      console.warn("No characters available for the intro modal.");
      this.startLevelTimer();
      return;
    }

    // Apply strong blur to the main game camera to hide the map
    this.gameCamera.setPostPipeline("BlurPostFX");
    const blurPipelines = this.gameCamera.getPostPipeline("BlurPostFX");
    const blurPipeline = Array.isArray(blurPipelines)
      ? blurPipelines[0]
      : blurPipelines;
    if (blurPipeline) {
      (blurPipeline as unknown as Phaser.FX.Blur).strength = 20; // Very high blur strength to completely hide the map
      (blurPipeline as unknown as Phaser.FX.Blur).quality = 3; // Higher quality blur
    }

    // Semi-transparent overlay - More opaque so user doesn't start searching
    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.85
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

    // Use background image as texture (no compression, just crop what's needed)
    const modalBackground = this.add.image(modalX, modalY, "modal-background");
    modalBackground.setScrollFactor(0);
    modalBackground.setDepth(101);
    // Don't scale - let it use its natural size and crop with mask
    modalBackground.setOrigin(0.5, 0.5);

    // Mask to create rounded corners and crop the image
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(
      modalX - modalWidth / 2,
      modalY - modalHeight / 2,
      modalWidth,
      modalHeight,
      25
    );
    const mask = maskShape.createGeometryMask();
    modalBackground.setMask(mask);

    // Title - Adapts based on number of characters
    const titleText = this.add.text(
      modalX,
      modalY - 250,
      hasMultipleTargets ? "FIND THEM ALL!" : "WHERE IS?",
      {
        fontSize: hasMultipleTargets ? "80px" : "96px",
        color: "#00FF88",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        stroke: "#000000",
        strokeThickness: 10,
        wordWrap: { width: modalWidth - 40, useAdvancedWrap: true },
      }
    );
    titleText.setOrigin(0.5);
    titleText.setPadding(48, 0, 48, 0);
    titleText.setScrollFactor(0);
    titleText.setDepth(102);

    // Subtitle - Adapts based on number of characters
    const subtitleMessage = hasMultipleTargets
      ? uniqueCharacterCount === 1
        ? `Find it ${this.totalTargetsToFind} times!`
        : `Find ${this.totalTargetsToFind} characters!`
      : "Find it before time runs out!";
    const subtitleText = this.add.text(modalX, modalY - 155, subtitleMessage, {
      fontSize: "36px",
      color: "#000000",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
    });
    subtitleText.setOrigin(0.5);
    subtitleText.setScrollFactor(0);
    subtitleText.setDepth(102);

    // Black circle background for character (reduced size)
    // Character preview display - adapt for single or multiple
    const characterPreviews: Phaser.GameObjects.GameObject[] = [];

    if (uniqueCharacterCount === 1) {
      // Single character - large circle
      const circleBg = this.add.graphics();
      circleBg.setScrollFactor(0);
      circleBg.setDepth(101);
      circleBg.fillStyle(0x000000, 1);
      circleBg.fillCircle(modalX, modalY + 30, 110);
      circleBg.lineStyle(4, 0x000000, 1);
      circleBg.strokeCircle(modalX, modalY + 30, 110);

      const characterPreview = this.add.image(
        modalX,
        modalY + 30,
        `${this.currentCharacters[0].id}-card`
      );
      characterPreview.setDisplaySize(300, 300);
      characterPreview.setScrollFactor(0);
      characterPreview.setDepth(102);

      characterPreviews.push(circleBg, characterPreview);

      const requiredCount =
        this.targetRequirements.get(this.currentCharacters[0].id) ?? 1;
      if (requiredCount > 1) {
        const badgeRadius = 38;
        const badgeX = modalX + 100;
        const badgeY = modalY - 40;

        const badgeBg = this.add.graphics();
        badgeBg.setScrollFactor(0);
        badgeBg.setDepth(103);
        badgeBg.fillStyle(0xf7ea48, 1);
        badgeBg.fillCircle(badgeX, badgeY, badgeRadius);
        badgeBg.lineStyle(6, 0x000000, 1);
        badgeBg.strokeCircle(badgeX, badgeY, badgeRadius);

        const badgeText = this.add.text(badgeX, badgeY, `x${requiredCount}`, {
          fontSize: "38px",
          color: "#000000",
          fontFamily: "Chicle, cursive",
          fontStyle: "normal",
        });
        badgeText.setOrigin(0.5);
        badgeText.setScrollFactor(0);
        badgeText.setDepth(104);

        characterPreviews.push(badgeBg, badgeText);
      }
    } else {
      // Multiple characters - smaller circles in a row
      const spacing = 140;
      const startX = modalX - ((uniqueCharacterCount - 1) * spacing) / 2;
      const y = modalY + 30;

      this.currentCharacters.forEach((char, index) => {
        const x = startX + index * spacing;

        const circleBg = this.add.graphics();
        circleBg.setScrollFactor(0);
        circleBg.setDepth(101);
        circleBg.fillStyle(0x000000, 1);
        circleBg.fillCircle(x, y, 60);
        circleBg.lineStyle(4, 0x000000, 1);
        circleBg.strokeCircle(x, y, 60);

        const characterPreview = this.add.image(x, y, `${char.id}-card`);
        characterPreview.setDisplaySize(160, 160);
        characterPreview.setScrollFactor(0);
        characterPreview.setDepth(102);

        characterPreviews.push(circleBg, characterPreview);

        const requiredCount = this.targetRequirements.get(char.id) ?? 1;
        if (requiredCount > 1) {
          const badgeBg = this.add.graphics();
          badgeBg.setScrollFactor(0);
          badgeBg.setDepth(103);
          badgeBg.fillStyle(0xf7ea48, 1);
          badgeBg.fillCircle(x + 60, y - 60, 26);
          badgeBg.lineStyle(4, 0x000000, 1);
          badgeBg.strokeCircle(x + 60, y - 60, 26);

          const badgeText = this.add.text(x + 60, y - 60, `x${requiredCount}`, {
            fontSize: "24px",
            color: "#000000",
            fontFamily: "Chicle, cursive",
            fontStyle: "normal",
          });
          badgeText.setOrigin(0.5);
          badgeText.setScrollFactor(0);
          badgeText.setDepth(104);

          characterPreviews.push(badgeBg, badgeText);
        }
      });
    }

    // Countdown text - Below character and circle (larger font)
    const countdownText = this.add.text(modalX, modalY + 240, "Ready", {
      fontSize: "80px",
      color: "#F7EA48",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000",
      strokeThickness: 10,
    });
    countdownText.setOrigin(0.5);
    countdownText.setScrollFactor(0);
    countdownText.setDepth(103);

    // Make game camera ignore modal elements
    this.gameCamera.ignore([
      overlay,
      modalBg,
      modalBackground,
      maskShape,
      titleText,
      subtitleText,
      ...characterPreviews,
      countdownText,
    ]);

    // Countdown logic - Start after 1 second delay
    const countdownWords = ["Ready", "Steady", "GO"];
    let countdownIndex = 0;

    // Wait 1 second before starting countdown
    this.time.delayedCall(1000, () => {
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
            modalBackground.destroy();
            maskShape.destroy();
            titleText.destroy();
            subtitleText.destroy();
            characterPreviews.forEach((obj) => obj.destroy());
            countdownText.destroy();

            // Remove blur from game camera
            this.isModalOpen = false;
            this.gameCamera.removePostPipeline("BlurPostFX");

            // Start game timer
            this.startLevelTimer();
          }
        },
        repeat: 2,
      });
    });
  }

  private showFoundModal() {
    const { width, height } = GameSettings.canvas;
    const hasMultipleTargets = this.totalTargetsToFind > 1;

    this.isModalOpen = true;

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

    // Use background image as texture (no compression, just crop what's needed)
    const foundModalBackground = this.add.image(
      modalX,
      modalY,
      "modal-background"
    );
    foundModalBackground.setScrollFactor(0);
    foundModalBackground.setDepth(101);
    // Don't scale - let it use its natural size and crop with mask
    foundModalBackground.setOrigin(0.5, 0.5);

    // Mask to create rounded corners and crop the image
    const foundMaskShape = this.make.graphics({});
    foundMaskShape.fillStyle(0xffffff);
    foundMaskShape.fillRoundedRect(
      modalX - modalWidth / 2,
      modalY - modalHeight / 2,
      modalWidth,
      modalHeight,
      25
    );
    const foundMask = foundMaskShape.createGeometryMask();
    foundModalBackground.setMask(foundMask);

    // "FOUND!" text shadow - Like MainScene title
    const foundTitle = hasMultipleTargets ? "ALL FOUND!" : "FOUND!";
    const foundTextShadow = this.add.text(
      modalX + 4,
      modalY - 166,
      foundTitle,
      {
        fontSize: hasMultipleTargets ? "96px" : "106px",
        color: "#00FF88",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        stroke: "#000000",
        strokeThickness: 12,
      }
    );
    foundTextShadow.setOrigin(0.5);
    foundTextShadow.setScrollFactor(0);
    foundTextShadow.setDepth(101);
    foundTextShadow.setAlpha(0.3);

    // "FOUND!" text - Green like CHARACTERS style with shadow
    const foundText = this.add.text(modalX, modalY - 170, foundTitle, {
      fontSize: hasMultipleTargets ? "96px" : "106px",
      color: "#00FF88",
      fontFamily: "Chicle, cursive",
      fontStyle: "normal",
      stroke: "#000000",
      strokeThickness: 10,
    });
    foundText.setOrigin(0.5);
    foundText.setScrollFactor(0);
    foundText.setDepth(102);

    // Character name text - Thicker border
    const characterNames = this.currentCharacters
      .map((char) => {
        const count = this.targetRequirements.get(char.id) ?? 1;
        return count > 1 ? `x${count} ${char.name}` : char.name;
      })
      .join(" & ");
    const characterNameText = this.add.text(
      modalX,
      modalY - 60,
      characterNames,
      {
        fontSize: hasMultipleTargets ? "42px" : "54px",
        color: "#F7EA48",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        stroke: "#000000",
        strokeThickness: 8,
        wordWrap: { width: modalWidth - 60 },
        align: "center",
      }
    );
    characterNameText.setOrigin(0.5);
    characterNameText.setScrollFactor(0);
    characterNameText.setDepth(102);

    // "Added to collection" message - Larger text
    const maxCharacterLevel = this.currentCharacters.reduce((max, char) => {
      const count = this.targetRequirements.get(char.id) ?? 1;
      return Math.max(max, count);
    }, 1);

    // Note: We only save unlocked/locked status, not levels
    // Character progression is tracked in GameStateManager

    const collectionText = this.add.text(
      modalX,
      modalY + 12,
      `Leveled up to Level ${maxCharacterLevel}!`,
      {
        fontSize: "34px",
        color: "#000000",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
      }
    );
    collectionText.setOrigin(0.5);
    collectionText.setScrollFactor(0);
    collectionText.setDepth(102);

    // Score points text - Larger text
    const totalPoints = Math.round(this.pointsEarnedThisLevel);
    const pointsText = this.add.text(
      modalX,
      modalY + 60,
      `+${totalPoints} POINTS`,
      {
        fontSize: "46px",
        color: "#000000",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
      }
    );
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

    // Create an invisible interactive zone for the entire button area
    const buttonZone = this.add.zone(
      modalX,
      buttonY,
      buttonWidth,
      buttonHeight
    );
    buttonZone.setInteractive();
    buttonZone.setScrollFactor(0);
    buttonZone.setDepth(102);

    // Button click handler on the entire zone
    buttonZone.on("pointerdown", () => {
      this.playButtonSound();
      // Clean up modal
      overlay.destroy();
      modalBg.destroy();
      foundModalBackground.destroy();
      foundMaskShape.destroy();
      foundText.destroy();
      characterNameText.destroy();
      collectionText.destroy();
      pointsText.destroy();
      buttonBg.destroy();
      buttonText.destroy();
      buttonZone.destroy();

      this.isModalOpen = false;

      // Add coins (scaled by number of targets)
      this.updateCoins(50 * this.totalTargetsToFind);

      this.pointsEarnedThisLevel = 0;

      // Go to next level
      this.goToNextLevel();
    });

    // Make game camera ignore modal elements
    this.gameCamera.ignore([
      overlay,
      modalBg,
      foundModalBackground,
      foundMaskShape,
      foundText,
      characterNameText,
      collectionText,
      pointsText,
      buttonBg,
      buttonText,
      buttonZone,
    ]);
  }

  private onCorrectCharacterFound() {
    // This method is no longer needed but keeping for reference
    this.updateScore(100);
  }

  private createUI() {
    const { width, height } = GameSettings.canvas;

    // Header background - White with black border
    const headerBg = this.add.graphics();
    headerBg.setScrollFactor(0);
    headerBg.setDepth(0);

    // Black border for header (3px)
    headerBg.fillStyle(0x000000, 1);
    headerBg.fillRect(0, 0, width, this.HEADER_HEIGHT + 3);

    // White background
    headerBg.fillStyle(0xffffff, 1);
    headerBg.fillRect(0, 0, width, this.HEADER_HEIGHT);

    // Box dimensions - adjusted sizes
    const levelWidth = 110; // "Level 1"
    const coinsWidth = 180; // Bigger coins box for future amounts
    const scoreWidth = 200; // Score box
    const timeWidth = 85; // Small time box (max "10s")
    const gapCenter = 0.5; // 0.5px separation between coins and score (almost touching)
    const gapSides = 15; // 15px separation on the sides
    const totalWidth =
      levelWidth +
      gapSides +
      coinsWidth +
      gapCenter +
      scoreWidth +
      gapSides +
      timeWidth;

    // Calculate starting X to center all boxes
    const startX = (width - totalWidth) / 2;
    const boxHeight = this.HEADER_HEIGHT - 10; // 5px padding top and bottom
    const boxY = 5;

    // Create graphics for boxes with backgrounds
    const boxGraphics = this.add.graphics();
    boxGraphics.setScrollFactor(0);
    boxGraphics.setDepth(1);

    // 1. LEVEL section
    const levelBoxX = startX;
    boxGraphics.fillStyle(0xf7ea48, 1); // Yellow background
    boxGraphics.fillRoundedRect(levelBoxX, boxY, levelWidth, boxHeight, 8);
    boxGraphics.lineStyle(3, 0x000000, 1);
    boxGraphics.strokeRoundedRect(levelBoxX, boxY, levelWidth, boxHeight, 8);

    this.levelText = this.add.text(
      levelBoxX + levelWidth / 2,
      this.HEADER_HEIGHT / 2,
      `Level ${this.currentLevel}`,
      {
        fontSize: "32px",
        color: "#000000",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
      }
    );
    this.levelText.setOrigin(0.5);
    this.levelText.setScrollFactor(0);
    this.levelText.setDepth(2);

    // 2. COINS section - Green background, bigger, yellow text with black border
    const coinsBoxX = startX + levelWidth + gapSides; // 8px gap from level
    boxGraphics.fillStyle(0x00ff88, 1); // Green background
    boxGraphics.fillRoundedRect(coinsBoxX, boxY, coinsWidth, boxHeight, 8);
    boxGraphics.lineStyle(3, 0x000000, 1);
    boxGraphics.strokeRoundedRect(coinsBoxX, boxY, coinsWidth, boxHeight, 8);

    this.coinsText = this.add.text(
      coinsBoxX + coinsWidth / 2,
      this.HEADER_HEIGHT / 2,
      `${this.currentCoins}$`,
      {
        fontSize: "32px",
        color: "#F7EA48",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
        stroke: "#000000",
        strokeThickness: 3,
      }
    );
    this.coinsText.setOrigin(0.5);
    this.coinsText.setScrollFactor(0);
    this.coinsText.setDepth(2);

    // 3. SCORE section
    const scoreBoxX = startX + levelWidth + gapSides + coinsWidth + gapCenter; // 1px gap from coins
    boxGraphics.lineStyle(3, 0x000000, 1);
    boxGraphics.strokeRoundedRect(scoreBoxX, boxY, scoreWidth, boxHeight, 8);

    this.scoreText = this.add.text(
      scoreBoxX + scoreWidth / 2,
      this.HEADER_HEIGHT / 2,
      `${this.currentScore} pts`,
      {
        fontSize: "32px",
        color: "#000000",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
      }
    );
    this.scoreText.setOrigin(0.5);
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(2);

    // 4. TIME section - Background color will change dynamically
    const timeBoxX =
      startX +
      levelWidth +
      gapSides +
      coinsWidth +
      gapCenter +
      scoreWidth +
      gapSides; // 8px gap from score

    // Store time box graphics separately for dynamic updates
    this.timeBoxGraphics = this.add.graphics();
    this.timeBoxGraphics.setScrollFactor(0);
    this.timeBoxGraphics.setDepth(1);

    // Initial green background
    this.timeBoxGraphics.fillStyle(0x00ff88, 1);
    this.timeBoxGraphics.fillRoundedRect(
      timeBoxX,
      boxY,
      timeWidth,
      boxHeight,
      8
    );
    this.timeBoxGraphics.lineStyle(3, 0x000000, 1);
    this.timeBoxGraphics.strokeRoundedRect(
      timeBoxX,
      boxY,
      timeWidth,
      boxHeight,
      8
    );

    // Store box position for updates
    this.timeBoxX = timeBoxX;
    this.timeBoxY = boxY;
    this.timeBoxWidth = timeWidth;
    this.timeBoxHeight = boxHeight;

    this.timeText = this.add.text(
      timeBoxX + timeWidth / 2,
      this.HEADER_HEIGHT / 2,
      `${this.timeRemainingSeconds}s`,
      {
        fontSize: "32px",
        color: "#000000",
        fontFamily: "Chicle, cursive",
        fontStyle: "normal",
      }
    );
    this.timeText.setOrigin(0.5);
    this.timeText.setScrollFactor(0);
    this.timeText.setDepth(2);

    // Make game camera ignore all UI elements
    this.gameCamera.ignore([
      headerBg,
      boxGraphics,
      this.timeBoxGraphics,
      this.levelText,
      this.coinsText,
      this.scoreText,
      this.timeText,
    ]);
  }

  private createScrollIndicator() {
    this.destroyScrollIndicator();

    const { width, height } = GameSettings.canvas;
    const indicatorWidth = Math.min(280, width - 60);
    const indicatorHeight = 44;
    const indicatorX = (width - indicatorWidth) / 2;
    const indicatorY = height - indicatorHeight - 20;

    const indicatorBg = this.add.graphics();
    indicatorBg.setScrollFactor(0);
    indicatorBg.setDepth(3);
    indicatorBg.fillStyle(0x000000, 0.45);
    indicatorBg.fillRoundedRect(
      indicatorX,
      indicatorY,
      indicatorWidth,
      indicatorHeight,
      16
    );
    indicatorBg.lineStyle(2, 0xffffff, 0.4);
    indicatorBg.strokeRoundedRect(
      indicatorX,
      indicatorY,
      indicatorWidth,
      indicatorHeight,
      16
    );

    const indicatorText = this.add.text(
      width / 2,
      indicatorY + indicatorHeight / 2,
      "<< Slide >>",
      {
        fontSize: "26px",
        color: "#FFFFFF",
        fontFamily: "Chicle, cursive",
        stroke: "#000000",
        strokeThickness: 4,
      }
    );
    indicatorText.setOrigin(0.5);
    indicatorText.setScrollFactor(0);
    indicatorText.setDepth(4);

    this.scrollIndicatorElements = [indicatorBg, indicatorText];
    this.gameCamera.ignore(this.scrollIndicatorElements);

    this.scrollIndicatorTween = this.tweens.add({
      targets: indicatorText,
      x: indicatorText.x + 16,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private destroyScrollIndicator() {
    if (this.scrollIndicatorTween) {
      this.scrollIndicatorTween.stop();
      this.scrollIndicatorTween.remove();
      this.scrollIndicatorTween = undefined;
    }

    this.scrollIndicatorElements.forEach((element) => element.destroy());
    this.scrollIndicatorElements = [];
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

  private stopMenuMusic() {
    MenuMusicController.stop(this);
  }

  private startLevelMusic() {
    if (GameScene.sharedLevelMusic && GameScene.sharedLevelMusic.isPlaying) {
      this.levelMusic = GameScene.sharedLevelMusic;
      return;
    }

    this.queueNextLevelTrack();
  }

  private queueNextLevelTrack() {
    const levelTracks = ["bgm-level-1", "bgm-level-2", "bgm-level-3"];
    const previous = GameScene.lastLevelMusicKey;
    const selectionPool = previous
      ? levelTracks.filter((track) => track !== previous)
      : levelTracks;
    const candidatePool =
      selectionPool.length > 0 ? selectionPool : levelTracks;
    const chosenKey = Phaser.Utils.Array.GetRandom(candidatePool);

    if (!this.cache?.audio?.exists(chosenKey)) {
      return;
    }

    const nextTrack = this.sound.add(chosenKey, {
      loop: false,
      volume: 0.14,
    });

    GameScene.lastLevelMusicKey = chosenKey;
    GameScene.sharedLevelMusic = nextTrack;
    this.levelMusic = nextTrack;

    nextTrack.once(Phaser.Sound.Events.COMPLETE, () => {
      if (GameScene.sharedLevelMusic === nextTrack) {
        GameScene.sharedLevelMusic = undefined;
      }
      nextTrack.destroy();
      const activeScene = GameScene.activeScene;
      if (activeScene && activeScene.levelMusic === nextTrack) {
        activeScene.levelMusic = undefined;
      }
      if (activeScene) {
        activeScene.queueNextLevelTrack();
      }
    });

    nextTrack.play();
  }

  private stopLevelMusic() {
    const music = GameScene.sharedLevelMusic ?? this.levelMusic;
    if (!music) {
      return;
    }

    if (music.isPlaying) {
      music.stop();
    }

    music.destroy();

    if (GameScene.sharedLevelMusic === music) {
      GameScene.sharedLevelMusic = undefined;
    }

    this.levelMusic = undefined;
  }

  public static stopGlobalLevelMusic(manager: Phaser.Sound.BaseSoundManager) {
    const music = GameScene.sharedLevelMusic;

    if (music) {
      if (music.isPlaying) {
        music.stop();
      }
      music.destroy();
    } else if (GameScene.lastLevelMusicKey) {
      const existing = manager.get(GameScene.lastLevelMusicKey);
      existing?.stop();
      existing?.destroy();
    }

    GameScene.sharedLevelMusic = undefined;
    GameScene.lastLevelMusicKey = null;
    GameScene.activeScene = undefined;
  }

  private playButtonSound() {
    this.playSound("sfx-button", { volume: 0.55 });
  }

  private playSuccessCue(remainingTargets: number) {
    if (remainingTargets <= 0) {
      this.playSound("sfx-success", { volume: 0.6 });
      this.successSoundToggle = 0;
      return;
    }

    const shouldUseAlt = this.successSoundToggle % 2 === 1;
    const key = shouldUseAlt ? "sfx-success-alt" : "sfx-success";

    this.playSound(key, { volume: 0.6 });
    this.successSoundToggle++;
  }

  private playSound(
    key: string,
    config?: Phaser.Types.Sound.SoundConfig
  ): void {
    if (!this.cache?.audio?.exists(key)) {
      return;
    }

    this.sound.play(key, config);
  }

  private setupControls() {
    // Pointer down - start drag
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

    // Ensure drag cancels if pointer leaves the game view
    this.input.on("pointerupoutside", () => {
      this.stopDrag();
    });
    this.input.on(Phaser.Input.Events.GAME_OUT, () => {
      this.stopDrag();
    });
  }

  private startDrag(pointer: Phaser.Input.Pointer) {
    if (this.isModalOpen) {
      this.isDragging = false;
      return;
    }

    if (pointer.y <= this.HEADER_HEIGHT) {
      this.isDragging = false;
      return;
    }

    this.isDragging = true;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
    this.dragStartScrollX = this.gameCamera.scrollX;
    this.dragStartScrollY = this.gameCamera.scrollY;
  }

  private dragCamera(pointer: Phaser.Input.Pointer) {
    const cam = this.gameCamera;
    const zoom = cam.zoom;

    // Calculate delta movement relative to drag start
    const deltaX = (this.dragStartX - pointer.x) / zoom;
    const deltaY = (this.dragStartY - pointer.y) / zoom;

    const targetScrollX = this.dragStartScrollX + deltaX;
    const targetScrollY = this.dragStartScrollY + deltaY;

    // Update camera scroll using absolute target values
    cam.scrollX = targetScrollX;
    cam.scrollY = targetScrollY;

    // Clamp camera to prevent showing empty space
    this.clampCamera();
  }

  private clampCamera() {
    const cam = this.gameCamera;

    // Ensure the camera has updated its internal matrices before reading dimensions
    cam.preRender();

    const bounds = cam.getBounds();

    // Calculate visible area based on available height (below header)
    const { width, height } = GameSettings.canvas;
    const availableHeight = height - this.HEADER_HEIGHT;
    const visibleWidth = width / cam.zoom;
    const visibleHeight = availableHeight / cam.zoom;

    const imageWidth = this.mapWidth || bounds.width;
    const imageHeight = this.mapHeight || bounds.height;

    // X limits: standard (0 to image - visible)
    const minScrollX = 0;
    const maxScrollX = Math.max(0, imageWidth - visibleWidth);

    // Y limits: simple 0 to max
    const minScrollY = 0;
    const maxScrollY = Math.max(0, imageHeight - visibleHeight);

    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, minScrollX, maxScrollX);
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, minScrollY, maxScrollY);
  }

  private stopDrag() {
    this.isDragging = false;
  }

  private startLevelTimer() {
    // Timer that counts down seconds
    this.levelTimer = this.time.addEvent({
      delay: 1000, // 1 second
      callback: () => {
        this.timeRemainingSeconds--;

        if (this.timeRemainingSeconds <= 0) {
          this.timeRemainingSeconds = 0;
          this.onTimeUp();
        }

        // Update time text with color based on remaining time
        this.updateTimeText();
      },
      loop: true,
    });
  }

  private updateTimeText() {
    // Change background color based on remaining time (max 15s)
    let backgroundColor = 0x00ff88; // Green
    if (this.timeRemainingSeconds <= 3) {
      backgroundColor = 0xff1744; // Red
    } else if (this.timeRemainingSeconds <= 6) {
      backgroundColor = 0xf7ea48; // Yellow
    }

    // Clear and redraw the time box with new color
    this.timeBoxGraphics.clear();
    this.timeBoxGraphics.fillStyle(backgroundColor, 1);
    this.timeBoxGraphics.fillRoundedRect(
      this.timeBoxX,
      this.timeBoxY,
      this.timeBoxWidth,
      this.timeBoxHeight,
      8
    );
    this.timeBoxGraphics.lineStyle(3, 0x000000, 1);
    this.timeBoxGraphics.strokeRoundedRect(
      this.timeBoxX,
      this.timeBoxY,
      this.timeBoxWidth,
      this.timeBoxHeight,
      8
    );

    // Update text (always black)
    this.timeText.setText(`${this.timeRemainingSeconds}s`);
    this.timeText.setColor("#000000");
  }

  private onTimeUp() {
    console.log("Time is up!");
    // Stop timer
    if (this.levelTimer) {
      this.levelTimer.remove();
    }

    // Stop all music
    this.sound.stopAll();

    // Game Over - handled by SDK
    console.log("Game Over: Time is up");
    // Call SDK gameOver
    if (typeof window !== "undefined" && (window as any).FarcadeSDK) {
      (window as any).FarcadeSDK.singlePlayer.actions.gameOver({
        score: this.currentScore,
      });
      console.log(
        "Farcade SDK: Game Over called with score:",
        this.currentScore
      );
    }
  }

  private updateScore(points: number) {
    this.currentScore += points;
    this.scoreText.setText(`${this.currentScore} pts`);
  }

  private updateCoins(coins: number) {
    this.currentCoins += coins;
    this.coinsText.setText(`${this.currentCoins}$`);
    this.coinsText.setColor("#F7EA48");
    this.coinsText.setStroke("#000000", 3);

    // Save coins to game state
    const stateManager = GameStateManager.getInstance();
    stateManager.addCoins(coins);
  }

  private updateLevel(level: number) {
    this.currentLevel = level;
    this.levelText.setText(`Level ${this.currentLevel}`);
  }

  private goToNextLevel() {
    // Unlock all characters found in this level and save their max level
    const stateManager = GameStateManager.getInstance();
    this.currentCharacters.forEach((character) => {
      // Get the level (instances) for this character in this level
      const characterLevel = this.targetRequirements.get(character.id) ?? 1;
      // Unlock character and update max level if this is higher
      stateManager.unlockCharacter(character.id, characterLevel);
    });

    // Infinite progression - no level cap
    this.currentLevel++;
    console.log(`Advancing to Level ${this.currentLevel}`);

    // Restart scene with new level data (NOT persisting level across sessions)
    this.scene.restart({
      currentLevel: this.currentLevel, // Only for current game session
      currentScore: this.currentScore,
      currentCoins: this.currentCoins,
      foundCharacters: this.foundCharacters,
      // characterLevels removed - no longer needed
    });
  }

  update() {
    // Game loop updates if needed
  }
}
