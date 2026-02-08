import { CHARACTER_TYPES } from "./character-types.js";

export const AVAILABLE_CHARACTERS = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];

export const ENEMY_TITLES = [
  ["Rookie", "Novice", "Trainee", "Apprentice"],
  ["Wandering", "Rogue", "Outcast", "Lone"],
  ["Skilled", "Veteran", "Battle-Hardened", "Seasoned"],
  ["Elite", "Shadow", "Deadly", "Fierce"],
  ["Master", "Legendary", "Fearsome", "Dreaded"],
  ["Demon", "Phantom", "Cursed", "Ancient"],
  ["SUPREME", "ULTIMATE", "TOWER LORD", "GRAND MASTER"],
  ["TOWER EMPEROR", "FINAL OVERLORD", "APEX TYRANT", "ABSOLUTE RULER"],
  ["VOID EMPEROR", "ENDLESS", "OBLIVION", "FINAL EXISTENCE"],
  ["COSMIC OVERLORD", "ETERNAL TYRANT", "INFINITE RULER", "OMNIPOTENT BEING"],
];

// Floor difficulty settings
export const FLOOR_SETTINGS = [
  null, // index 0 unused
  {
    difficulty: "easy",
    aggressiveness: 0.3,
    baseStrength: 45,
    baseSpeed: 40,
    baseDefense: 30,
  },
  {
    difficulty: "easy",
    aggressiveness: 0.4,
    baseStrength: 55,
    baseSpeed: 50,
    baseDefense: 35,
  },
  {
    difficulty: "normal",
    aggressiveness: 0.5,
    baseStrength: 60,
    baseSpeed: 55,
    baseDefense: 45,
  },
  {
    difficulty: "normal",
    aggressiveness: 0.55,
    baseStrength: 65,
    baseSpeed: 60,
    baseDefense: 55,
  },
  {
    difficulty: "hard",
    aggressiveness: 0.65,
    baseStrength: 72,
    baseSpeed: 65,
    baseDefense: 62,
  },
  {
    difficulty: "hard",
    aggressiveness: 0.75,
    baseStrength: 80,
    baseSpeed: 72,
    baseDefense: 70,
  },
  {
    difficulty: "expert",
    aggressiveness: 0.85,
    baseStrength: 90,
    baseSpeed: 78,
    baseDefense: 80,
  },
  {
    difficulty: "expert",
    aggressiveness: 0.9,
    baseStrength: 100,
    baseSpeed: 85,
    baseDefense: 90,
  },
  {
    difficulty: "final_boss",
    aggressiveness: 0.95,
    baseStrength: 120,
    baseSpeed: 90,
    baseDefense: 100,
  },
  {
    difficulty: "final_boss",
    aggressiveness: 1.0,
    baseStrength: 150,
    baseSpeed: 95,
    baseDefense: 120,
    isBoss: true,
  },
];

// Current tower enemies (randomized each run)
export let TOWER_ENEMIES = [];

export const TOTAL_FLOORS = 10;
export const STORAGE_KEY = "towerProgress";

export const TowerState = {
  INTRO: "towerIntro",
  STAGE_SELECT: "towerStageSelect",
  FIGHT: "towerFight",
  ROUND_RESULT: "towerRoundResult",
  STAGE_VICTORY: "towerStageVictory",
  TOWER_COMPLETE: "towerComplete",
  DEFEAT: "towerDefeat",
  EXIT: "towerExit",
};

// Shuffle array using Fisher-Yates algorithm
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get random item from array
export function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate randomized tower enemies
export function generateTowerEnemies() {
  const shuffledChars = shuffleArray(AVAILABLE_CHARACTERS);

  TOWER_ENEMIES = [null];

  for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
    const charId = shuffledChars[(floor - 1) % shuffledChars.length];
    const charType =
      typeof CHARACTER_TYPES !== "undefined"
        ? CHARACTER_TYPES[charId]
        : { name: `Char${charId}` };
    const floorSetting = FLOOR_SETTINGS[floor];
    const titlePrefix = randomFrom(ENEMY_TITLES[floor - 1]);

    let name = `${titlePrefix} ${charType.name}`;
    if (floor === 10) {
      name = `${titlePrefix} ${charType.name}`;
    }

    TOWER_ENEMIES.push({ characterId: charId, name: name, ...floorSetting });
  }

  console.log("Tower enemies generated:", TOWER_ENEMIES);
}
