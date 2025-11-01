/**
 * Game State Manager
 * Manages persistent game state including unlocked characters and coins
 * Note: Game level is NOT saved - players always start from level 1
 * Character card levels ARE saved - they show max instances found together
 */

export interface CharacterProgress {
  id: string;
  unlocked: boolean; // true = unlocked, false = locked
  maxLevel: number; // Highest number of instances found together (for card display)
}

export interface GameStateData {
  coins: number;
  characters: CharacterProgress[];
}

export class GameStateManager {
  private static instance: GameStateManager;
  private gameState: GameStateData;

  private constructor() {
    this.gameState = {
      coins: 0,
      characters: [],
    };
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  /**
   * Initialize game state from SDK
   */
  initializeFromSDK(initialState: any) {
    if (initialState?.gameState) {
      this.gameState = {
        coins: initialState.gameState.coins || 0,
        characters: initialState.gameState.characters || [],
      };
      console.log("Game state loaded from SDK:", this.gameState);
    } else {
      console.log("No previous game state, starting fresh");
    }
  }

  /**
   * Get current coins
   */
  getCoins(): number {
    return this.gameState.coins;
  }

  /**
   * Add coins and save state
   */
  addCoins(amount: number) {
    this.gameState.coins += amount;
    this.saveState();
  }

  /**
   * Spend coins (returns true if successful)
   */
  spendCoins(amount: number): boolean {
    if (this.gameState.coins >= amount) {
      this.gameState.coins -= amount;
      this.saveState();
      return true;
    }
    return false;
  }

  /**
   * Get character progress
   */
  getCharacterProgress(characterId: string): CharacterProgress {
    const progress = this.gameState.characters.find(
      (c) => c.id === characterId
    );
    return progress || { id: characterId, unlocked: false, maxLevel: 0 };
  }

  /**
   * Check if character is unlocked
   */
  isCharacterUnlocked(characterId: string): boolean {
    const progress = this.getCharacterProgress(characterId);
    return progress.unlocked;
  }

  /**
   * Get character max level (highest instances found together)
   */
  getCharacterLevel(characterId: string): number {
    const progress = this.getCharacterProgress(characterId);
    return progress.maxLevel;
  }

  /**
   * Unlock character and update max level if higher
   */
  unlockCharacter(characterId: string, level: number = 1) {
    const existingIndex = this.gameState.characters.findIndex(
      (c) => c.id === characterId
    );

    if (existingIndex >= 0) {
      // Already exists, update if level is higher
      const current = this.gameState.characters[existingIndex];
      if (!current.unlocked || level > current.maxLevel) {
        this.gameState.characters[existingIndex] = {
          id: characterId,
          unlocked: true,
          maxLevel: Math.max(current.maxLevel, level),
        };
        console.log(`Character ${characterId} updated to level ${Math.max(current.maxLevel, level)}`);
        this.saveState();
      }
    } else {
      // Add new character as unlocked with level
      this.gameState.characters.push({
        id: characterId,
        unlocked: true,
        maxLevel: level,
      });
      console.log(`Character ${characterId} unlocked at level ${level}`);
      this.saveState();
    }
  }

  /**
   * Get all unlocked characters
   */
  getUnlockedCharacters(): CharacterProgress[] {
    return this.gameState.characters.filter((c) => c.unlocked);
  }

  /**
   * Save current state to SDK
   */
  private saveState() {
    if (typeof window !== "undefined" && (window as any).FarcadeSDK) {
      (window as any).FarcadeSDK.singlePlayer.actions.saveGameState({
        gameState: this.gameState,
      });
      console.log("Game state saved:", this.gameState);
    }
  }

  /**
   * Get raw game state (for debugging)
   */
  getGameState(): GameStateData {
    return { ...this.gameState };
  }

  /**
   * Reset all progress (for testing)
   */
  resetProgress() {
    this.gameState = {
      coins: 0,
      characters: [],
    };
    this.saveState();
    console.log("Game state reset");
  }
}

export default GameStateManager;
