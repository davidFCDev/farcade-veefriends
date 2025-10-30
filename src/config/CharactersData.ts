// VeeFriends Characters Data
// Each character has: map image, card image, name, description, and level

export interface CharacterData {
  id: string; // Unique identifier (e.g., "graceful-goldfish")
  name: string; // Display name (e.g., "Graceful Goldfish")
  description: string; // Character description
  level: number; // Level where this character appears
  mapImageUrl: string; // URL for the map sprite
  cardImageUrl: string; // URL for the album card
}

// Characters database
export const CHARACTERS_DATA: CharacterData[] = [
  {
    id: "graceful-goldfish",
    name: "Graceful Goldfish",
    description:
      "A beautiful and elegant goldfish that moves with grace and poise.",
    level: 1,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/graceful-goldfish-map-Oeprw8aLKcbLHzx7mAME1dybu8DN2z.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/graceful-goldfish-map-Oeprw8aLKcbLHzx7mAME1dybu8DN2z.png",
  },
  // Add more characters here as you provide them:
  // {
  //   id: "character-id",
  //   name: "Character Name",
  //   description: "Character description",
  //   level: 2,
  //   mapImageUrl: "url-to-map-image",
  //   cardImageUrl: "url-to-card-image",
  // },
];

// Helper functions
export function getCharacterById(id: string): CharacterData | undefined {
  return CHARACTERS_DATA.find((char) => char.id === id);
}

export function getCharactersByLevel(level: number): CharacterData[] {
  return CHARACTERS_DATA.filter((char) => char.level === level);
}

export function getAllCharacters(): CharacterData[] {
  return CHARACTERS_DATA;
}

export function getTotalLevels(): number {
  const levels = CHARACTERS_DATA.map((char) => char.level);
  return Math.max(...levels);
}
