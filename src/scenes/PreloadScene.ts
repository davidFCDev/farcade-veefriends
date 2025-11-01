import { getAllCharacters } from "../config/CharactersData";

export class PreloadScene extends Phaser.Scene {
  private progressBarElement?: HTMLElement;
  private assetsLoaded: boolean = false;

  constructor() {
    super({ key: "PreloadScene" });
  }

  init(): void {
    this.cameras.main.setBackgroundColor("#000000");
    this.createStudioBranding();
  }

  preload(): void {
    // Setup loading progress listeners
    this.load.on("progress", (value: number) => {
      this.updateProgressBar(value);
    });

    this.load.on("complete", () => {
      console.log("✅ Todos los assets cargados al 100%");
      this.assetsLoaded = true;
      this.updateProgressBar(1);
    });

    // Load WebFont for Chicle
    this.load.script(
      "webfont",
      "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
    );

    // Load modal background image
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
      "sfx-swipe",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/swipe-gq4oztrjb4E2kHftiKL7G31dvlMxWx.mp3?L6hd"
    );

    // Load level music
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

    // Load menu music
    this.load.audio(
      "bgm-menu",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/main-song-PcbJRVFBNYAiEXs0hmOdFb2GWzD7X9.mp3?rwJn"
    );

    // Load main page background
    this.load.image(
      "main-background",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/fondo-menu-vQS6CJPtxGbp0RddLKY1Wjk0p3Ya46.webp"
    );

    // Load album background
    this.load.image(
      "album-background",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/fondo-textura-DUv1xwl3LH3zlOf4D4mACjNtBrTSET.webp"
    );

    // Load all character images dynamically
    const characters = getAllCharacters();
    characters.forEach((character) => {
      this.load.image(`${character.id}-map`, character.mapImageUrl);
      this.load.image(`${character.id}-card`, character.cardImageUrl);
    });

    // Load level map backgrounds (1-13)
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

  create(): void {
    // Assets loaded, wait for minimum display time then transition
  }

  private createStudioBranding(): void {
    const gameCanvas = this.sys.game.canvas;
    const gameContainer = gameCanvas.parentElement;

    const overlay = document.createElement("div");
    overlay.id = "studio-overlay";
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #000000;
      z-index: 9999;
      pointer-events: all;
    `;

    const studioText = document.createElement("div");
    studioText.id = "studio-text";
    studioText.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: "Pixelify Sans", "Press Start 2P", system-ui, monospace;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 3px 3px 0 #000;
      gap: 6px;
      opacity: 0;
      transform: translateY(8px) scale(0.98);
      transition: opacity 700ms ease, transform 500ms cubic-bezier(0.2, 0.6, 0.2, 1);
      min-height: 80px;
      width: 100%;
    `;

    const brandMain = document.createElement("div");
    brandMain.style.cssText = `
      font-size: 24px;
      letter-spacing: 3px;
      line-height: 1;
      color: #ffffff;
      position: relative;
      text-shadow: 2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000,
        2px 2px #000, -2px 2px #000, 2px -2px #000, -2px -2px #000,
        3px 3px 0 #000;
      margin-bottom: 8px;
    `;
    brandMain.textContent = "HELLBOUND";

    const progressContainer = document.createElement("div");
    progressContainer.style.cssText = `
      width: 200px;
      height: 20px;
      border: 3px solid #000000;
      border-radius: 12px;
      margin: 12px auto;
      display: block;
      position: relative;
      box-sizing: border-box;
      background: #1a1a1a;
      overflow: hidden;
      box-shadow: 
        inset 0 2px 4px rgba(0, 0, 0, 0.5),
        0 0 8px rgba(183, 255, 0, 0.3);
    `;

    const greenLine = document.createElement("div");
    greenLine.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(to bottom, 
        #b7ff00 0%, 
        #a0e600 30%,
        #8fcc00 50%,
        #a0e600 70%,
        #b7ff00 100%
      );
      border-radius: 9px;
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      box-shadow: 
        0 0 10px rgba(183, 255, 0, 0.6),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    `;

    progressContainer.appendChild(greenLine);
    this.progressBarElement = greenLine;

    const brandSub = document.createElement("div");
    brandSub.style.cssText = `
      font-size: 14px;
      letter-spacing: 4px;
      color: #b7ff00;
      text-shadow: 3px 3px 0 #000, 0 0 10px rgba(183, 255, 0, 0.3);
      line-height: 1;
    `;
    brandSub.textContent = "STUDIOS";

    const brandTm = document.createElement("span");
    brandTm.style.cssText = `
      position: absolute;
      top: -6px;
      right: -16px;
      font-size: 9px;
      color: #ffffff;
      text-shadow: 2px 2px 0 #000;
      opacity: 0.9;
    `;
    brandTm.textContent = "™";

    brandMain.appendChild(brandTm);
    studioText.appendChild(brandMain);
    studioText.appendChild(progressContainer);
    studioText.appendChild(brandSub);
    overlay.appendChild(studioText);

    if (gameContainer) {
      gameContainer.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }

    (this as any).studioOverlay = overlay;
    (this as any).studioText = studioText;

    this.showStudioText();
  }

  private showStudioText(): void {
    const studioText = (this as any).studioText;

    if (!studioText) {
      this.transitionToGame().catch(console.error);
      return;
    }

    studioText.style.opacity = "1";
    studioText.style.transform = "translateY(0) scale(1)";

    this.waitForAssetsAndTransition();
  }

  private waitForAssetsAndTransition(): void {
    const minDisplayTime = 2000;
    const startTime = Date.now();

    const checkAndTransition = () => {
      const elapsedTime = Date.now() - startTime;

      if (this.assetsLoaded && elapsedTime >= minDisplayTime) {
        console.log("🎮 Transición a MainScene");

        const studioText = (this as any).studioText;
        if (studioText) {
          studioText.style.opacity = "0";
          studioText.style.transform = "translateY(8px) scale(0.98)";
        }

        setTimeout(() => {
          this.transitionToGame().catch(console.error);
        }, 600);
      } else {
        setTimeout(checkAndTransition, 100);
      }
    };

    checkAndTransition();
  }

  private updateProgressBar(progress: number): void {
    if (this.progressBarElement) {
      const percentage = Math.round(progress * 100);
      this.progressBarElement.style.width = `${percentage}%`;
      console.log(`📦 Loading: ${percentage}%`);
    }
  }

  private async transitionToGame(): Promise<void> {
    const overlay = (this as any).studioOverlay;

    if (overlay && overlay.parentElement) {
      overlay.parentElement.removeChild(overlay);
      (this as any).studioOverlay = null;
      (this as any).studioText = null;
    }

    this.progressBarElement = undefined;
    this.scene.start("MainScene");
  }
}
