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
      "Graceful Goldfish glides through life with an air of serenity and wisdom.",
    level: 1,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/graceful-goldfish-map-Oeprw8aLKcbLHzx7mAME1dybu8DN2z.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/graceful-goldfish-card-Q8aA2CJAf8jB0YZOvEaFqG5xYMYI3t.png",
  },
  {
    id: "courageous-cockatoo",
    name: "Courageous Cockatoo",
    description:
      "She tells us that real courage isn't about avoiding the challenges, but facing them head-on with a fearless spirit.",
    level: 2,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/courageous-cockatoo-map-FssNsGOeNc2sXeWeicY42fqUKyPViH.webp",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/courageous-cockatoo-card-x3l0PjLJyfaPcDN83sTjdmc5tPIfQa.webp",
  },
  {
    id: "pleasant-platypus",
    name: "Pleasant Platypus",
    description:
      "He is a charming anomaly who defies expectations and embraces their one-of-a-kind self.",
    level: 3,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/pleasant-platypus-map-f2KLJ2ScyTr6UscZoWRq90o6eFPOTz.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/pleasant-platypus-card-dIk0Fvl6KQi4SX2cdAl63ubVfsug0v.png",
  },
  {
    id: "reliable-rat",
    name: "Reliable Rat",
    description:
      "He defies expectations, proving that trustworthiness and dependability can be found in the most unexpected places.",
    level: 4,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/reliable-rat-map-aMeoMq3tmNNyptrSOVlIfjhhxFkV0r.webp",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/reliable-rat-card-JJkdBHSE73zu89NbcKygxf0NZnjd5v.webp",
  },
  {
    id: "bad-intentions",
    name: "Bad Intentions",
    description:
      "Bad Intentions rises from the earth in The Origin of Fearless Fairy.",
    level: 5,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/bad-intentions-map-wrBZ0pKQ4z6LFvWajbPhtOLi4b0TMH.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/bad-intentions-card-UkphxGR2hFyMtwniAYXdacYGzAGxyK.png",
  },
  {
    id: "cynical-cat",
    name: "Cynical Cat",
    description:
      "Cynical Cat makes his debut in The Battle for Balance as part of the VeeFriends team sent to help a troubled teen named Mikey.",
    level: 6,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/cynical-cat-map-B0SUPvg6uPNyIkCrIihe4cr5EVHXPM.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/cynical-cat-card-foudVvsXWt39qjT7zLKDbOoF6oUseC.png",
  },
  {
    id: "notorious-ninja",
    name: "Notorious Ninja",
    description:
      "He is a skatepark legend, the kind of figure people whisper about when he skates by.",
    level: 7,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/notorious-ninja-map-qjfRFD2b2YKUBvYJ6anZYdDPeuz9nw.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/notorious-ninja-card-xeOfOcjxUYN7hkRGzlscSyR2txzJQr.png",
  },
  {
    id: "alpha-alligator",
    name: "Alpha Alligator",
    description:
      "Alpha Alligator is the ultimate insider, always ahead of the curve with an instinct for spotting what's next.",
    level: 8,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/alpha-alligator-map-bB2UkW8Lqrzzj1a3Xh4O3h8cls1TGb.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/alpha-alligator-card-ad3bRW5jI3ACFFhJJJDEXSKCbjZtPz.png",
  },
  {
    id: "shrewd-sheep",
    name: "Shrewd Sheep",
    description:
      "He's observant, analytical, and possesses a keen understanding of how things work.",
    level: 9,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/shrewd-sheep-map-UuLEYyGgctOoHToyyvDvZrTN21k9qm.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/shrewd-sheep-card-T4JhimJ1CoJIGqt6Zs5CCb92rlJnbk.png",
  },
  {
    id: "jolly-jack-o",
    name: "Jolly Jack-O",
    description:
      "He's the jolly friend who always makes you smile, even when times are tough.",
    level: 10,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/jolly-jack-o-map-tWqLWW0u21vUEeuFSuVCbDRLxtETyh.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/jolly-jack-o-card-s5sd6M7Bq8CrQQCF5i0KHzooD9HVJ7.png",
  },
  {
    id: "motivated-monster",
    name: "Motivated Monster",
    description: "He's a monster, but not like the scary stories you've heard.",
    level: 11,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/motivated-monster-map-EUZJlEuUd4eEoBgXgv6LUExAsABtcO.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/motivated-monster-card-CvJzNuhAC9SujFPl5WGCaaAgWpjJwU.png",
  },
  {
    id: "forever-phoenix",
    name: "Forever Phoenix",
    description:
      "Rising from the ashes of every challenge stronger and more determined than before.",
    level: 12,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/forever-phoenix-map-euxHMKdMLlegCRT7tt0P4AlvZKkSws.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/forever-phoenix-card-1JpbNUzquclVp9R4NVQWRs6y7w5Lz6.png",
  },
  {
    id: "happy-hermit",
    name: "Happy Hermit",
    description:
      "He may be a little shy at times, but he loves venturing out of his comfort zone and exploring new possibilities.",
    level: 13,
    mapImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/happy-hermit-map-DhtfD9mPhn9X7d7jXLZPLNaCpzY1zT.png",
    cardImageUrl:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/8f3d671b-9e38-458d-ae3b-af467487d556/happy-hermit-card-2Mcnqf1gWHeyg8ePURiLA3Tjyool26.png",
  },
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
