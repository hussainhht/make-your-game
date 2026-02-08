import { Engine } from "./core/engine.js";
import { Input } from "./core/input.js";
import { Player } from "./entities/player.js";
import { Enemy } from "./entities/enemy.js";
import { SpritePlayer } from "./entities/sprite-player.js";
import { SpriteEnemy } from "./entities/sprite-enemy.js";
import { TrainingDummy } from "./entities/training-dummy.js";
import { CHARACTER_TYPES } from "./character-types.js";
import {
  initUI,
  entitiesLayer,
  createHUD,
  createHealthBars,
  createDefenseHUD,
  createPauseOverlay,
  createTrainingDamageUI,
  showRoundStart,
  showGameOverScreen,
  updateHUD,
  updateHealthBars,
  updateDefenseHUD,
  showHitEffect,
  showBlockEffect,
  showTrainingDps,
  showPauseOverlay,
  hidePauseOverlay,
} from "./ui-main.js";

let engine, input, player, enemy;
let gameState = "playing";
let currentRound = 1;
let maxRounds = 3;
let playerWins = 0;
let enemyWins = 0;
let hitRegistered = { player: false, enemy: false };

let playerEl, enemyEl;

let trainingMode = false;

let score = 0;

const ROUND_DURATION = 90;
let roundTimeRemaining = ROUND_DURATION;

const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;

let isItHitler = false;

const sfxDarkFighterSpawn = new Audio("assets/audio/Adolf Hitler.mp3");
sfxDarkFighterSpawn.preload = "auto";
sfxDarkFighterSpawn.volume = 1;

const bgm = new Audio("assets/audio/background.mp3");
bgm.loop = true;
bgm.volume = 0.1;
bgm.preload = "auto";

function loadGameConfig() {
  try {
    const configStr = sessionStorage.getItem("gameConfig");
    if (configStr) {
      const config = JSON.parse(configStr);
      console.log("Loaded game config:", config);
      return config;
    }
  } catch (e) {
    console.error("Error loading game config:", e);
  }
  return null;
}

function init() {
  const gameConfig = loadGameConfig();

  trainingMode = gameConfig?.mode === "training";

  if (gameConfig && gameConfig.rounds) {
    maxRounds = parseInt(gameConfig.rounds);
  }

  const maps = [
    "assets/maps/Alhabash Underground Garage.png",
    "assets/maps/Ashfall Arcade.png",
    "assets/maps/Blackout Stage.png",
    "assets/maps/Bytefall Cafeteria.png",
    "assets/maps/Day in the Garage.png",
    "assets/maps/hamanyy map.png",
    "assets/maps/Hanon Quiet Slumber.png",
    "assets/maps/Jamil Last Stand.png",
    "assets/maps/Main Stage Arena.png",
    "assets/maps/Melvis Power.png",
    "assets/maps/Open Floor Lab.png",
    "assets/maps/Pixel Aftermath.png",
    "assets/maps/Quiet Compute Hall.png",
    "assets/maps/reboot door.png",
    "assets/maps/Reboot Innovation Lounge.png",
    "assets/maps/reboot sofa.png",
    "assets/maps/Reboot Training Hub.png",
    "assets/maps/Reboot Lobby Inferno.png",
    "assets/maps/Rubber duck debugging.png",
  ];

  // Use selected map or random
  let selectedMapPath;
  if (gameConfig?.map && gameConfig.map !== "random") {
    const mapIndex = parseInt(gameConfig.map) - 1;
    selectedMapPath =
      maps[mapIndex] || maps[Math.floor(Math.random() * maps.length)];
  } else {
    selectedMapPath = maps[Math.floor(Math.random() * maps.length)];
  }

  initUI(BASE_WIDTH, BASE_HEIGHT, selectedMapPath);

  unlockAudioAndStartBGMOnce();

  input = new Input();

  const characterId = gameConfig?.character?.id || "1";
  const charInfo = CHARACTER_TYPES[characterId] || CHARACTER_TYPES[1];
  const difficulty = gameConfig?.difficulty || "normal";

  if (charInfo.useSprite) {
    const playerScale =
      charInfo.customScale ||
      (charInfo.spriteConfig?.spriteWidth === 128 ? 2 : 2.5);
    player = new SpritePlayer({
      name: gameConfig?.character?.name || charInfo.name,
      x: 150,
      y: 300,
      strength: parseInt(gameConfig?.character?.strength) || 75,
      speed: parseInt(gameConfig?.character?.speed) || 80,
      defense: parseInt(gameConfig?.character?.defense) || 65,
      facing: 1,
      scale: playerScale,
      spriteConfig: charInfo.spriteConfig,
    });
  } else {
    player = new Player({
      name: gameConfig?.character?.name || "Player",
      x: 150,
      y: 400,
      characterType: charInfo.type,
      color: charInfo.color,
      strength: parseInt(gameConfig?.character?.strength) || 70,
      speed: parseInt(gameConfig?.character?.speed) || 70,
      defense: parseInt(gameConfig?.character?.defense) || 70,
      facing: 1,
    });
  }

  if (trainingMode) {
    enemy = new TrainingDummy({
      name: "Training Dummy",
      x: BASE_WIDTH / 2 - 64,
      y: 400,
      characterType: "dummy",
      facing: -1,
    });
  } else {
    const spriteEnemyTypes = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const randomEnemyId =
      spriteEnemyTypes[Math.floor(Math.random() * spriteEnemyTypes.length)];
    const enemyCharInfo = CHARACTER_TYPES[randomEnemyId];

    const useSpriteEnemy = Math.random() < 1;

    if (useSpriteEnemy && enemyCharInfo?.useSprite) {
      const enemyScale =
        enemyCharInfo.customScale ||
        (enemyCharInfo.spriteConfig?.spriteWidth === 128 ? 2 : 2.5);
      enemy = new SpriteEnemy({
        name: enemyCharInfo.name + " (Enemy)",
        x: 650,
        y: 300,
        strength: 70,
        speed: 65,
        defense: 60,
        facing: -1,
        difficulty: difficulty,
        scale: enemyScale,
        spriteConfig: enemyCharInfo.spriteConfig,
      });
      isItHitler = false;
    } else {
      enemy = new Enemy({
        name: "Dark Fighter",
        x: 680,
        y: 400,
        characterType: "enemy",
        color: "#ff4400",
        strength: 65,
        speed: 60,
        defense: 60,
        facing: -1,
        difficulty: difficulty,

        aggressiveness:
          difficulty === "easy" ? 0.3 : difficulty === "hard" ? 0.7 : 0.5,
      });
      isItHitler = true;
    }
  }

  playerEl = createFighterEl("player");
  enemyEl = createFighterEl("enemy");
  entitiesLayer.appendChild(playerEl);
  entitiesLayer.appendChild(enemyEl);

  player.attach(playerEl);
  enemy.attach(enemyEl);

  createHUD();
  createHealthBars(gameConfig?.character?.name);
  createDefenseHUD();
  createPauseOverlay(
    resumeGame,
    restartGame,
    () => (window.location.href = "home.html"),
  );

  if (trainingMode) createTrainingDamageUI();

  engine = new Engine(update, render);

  function unlockAudioAndStartBGMOnce() {
    const unlock = () => {
      bgm
        .play()
        .then(() => {
          bgm.volume = 0.05;
        })
        .catch((e) => console.error("bgm blocked:", e));

      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  }

  // Show intro or start immediately
  if (gameConfig?.mode === "arcade") {
    showRoundStart(currentRound, () => {
      engine.start();
    });
  } else {
    engine.start();
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") togglePause();
  });
}

function createFighterEl(type) {
  const el = document.createElement("div");
  el.className = `fighter ${type}`;
  return el;
}

function update(dt) {
  if (gameState !== "playing") return;

  if (!trainingMode) {
    roundTimeRemaining = Math.max(0, roundTimeRemaining - dt);
    if (roundTimeRemaining <= 0) {
      handleTimeUp();
      return;
    }
  }

  player.update(dt, input, enemy);
  enemy.update(dt, input, player);

  input.update();

  if (!player.attackBox.active) {
    hitRegistered.player = false;
  }
  if (!enemy.attackBox.active) {
    hitRegistered.enemy = false;
  }

  if (player.isAttackHitting(enemy) && !hitRegistered.player) {
    const damageResult = enemy.takeDamage(player.attackBox.damage, player);
    const damage =
      typeof damageResult === "object" ? damageResult.damage : damageResult;

    hitRegistered.player = true;

    if (damage > 0) {
      score += damage * 10;
      showHitEffect(enemy);

      if (typeof damageResult === "object" && !damageResult.blocked) {
        player.defenseSystem.registerHit();
      }
    }

    if (trainingMode) {
      showTrainingDps(damage);
    }

    if (typeof damageResult === "object") {
      if (damageResult.blocked) {
        showBlockEffect(enemy, damageResult.perfectBlock);
      }
    }
  }

  if (enemy.isAttackHitting(player) && !hitRegistered.enemy) {
    const damageResult = player.takeDamage(enemy.attackBox.damage, enemy);
    const damage =
      typeof damageResult === "object" ? damageResult.damage : damageResult;

    hitRegistered.enemy = true;

    if (isItHitler) {
      playSpecialHitSfx();
    }

    if (damage > 0) {
      showHitEffect(player);

      if (typeof damageResult === "object" && !damageResult.blocked) {
        enemy.defenseSystem.registerHit();
      }
    }

    if (typeof damageResult === "object") {
      if (damageResult.blocked) {
        showBlockEffect(player, damageResult.perfectBlock);
      }
    }
  }

  updateHealthBars(player, enemy);
  updateDefenseHUD(player, enemy);
  updateHUD({ currentRound, score, playerWins, enemyWins, roundTimeRemaining });

  if (!trainingMode && (player.health <= 0 || enemy.health <= 0)) {
    endRound(player.health > 0);
  }
}

function endRound(playerWon) {
  gameState = "round_end";
  engine.pause();

  if (playerWon) {
    playerWins++;
    score += 500;
  } else {
    enemyWins++;
  }

  updateHUD({ currentRound, score, playerWins, enemyWins, roundTimeRemaining });

  const winsNeeded = Math.ceil(maxRounds / 2);
  if (playerWins >= winsNeeded || enemyWins >= winsNeeded) {
    setTimeout(
      () =>
        showGameOverScreen(
          playerWins >= winsNeeded,
          restartGame,
          () => (window.location.href = "home.html"),
          score,
        ),
      1000,
    );
  } else {
    currentRound++;
    setTimeout(() => {
      player.reset(150);
      enemy.reset(680);
      roundTimeRemaining = ROUND_DURATION;
      updateHealthBars(player, enemy);
      updateHUD({
        currentRound,
        score,
        playerWins,
        enemyWins,
        roundTimeRemaining,
      });
      showRoundStart(currentRound, () => {
        gameState = "playing";
        engine.resume();
      });
    }, 1500);
  }
}

function render() {
  player.render(false);
  enemy.render(false);
}

function togglePause() {
  if (gameState === "paused") resumeGame();
  else if (gameState === "playing") pauseGame();
}

function pauseGame() {
  if (gameState !== "playing") return;
  gameState = "paused";
  bgm.pause();
  showPauseOverlay();
  engine.pause();
}

function resumeGame() {
  if (gameState !== "paused") return;
  gameState = "playing";
  hidePauseOverlay();
  engine.resume();
  bgm.play().catch(() => {});
}

function restartGame() {
  currentRound = 1;
  playerWins = 0;
  enemyWins = 0;
  score = 0;
  roundTimeRemaining = ROUND_DURATION;
  player.reset(150);
  enemy.reset(680);
  updateHealthBars(player, enemy);
  updateHUD({ currentRound, score, playerWins, enemyWins, roundTimeRemaining });
  gameState = "playing";
  hidePauseOverlay();
  engine.resume();
  bgm.play().catch(() => {});
}

init();

function handleTimeUp() {
  if (trainingMode || gameState !== "playing") return;

  gameState = "round_end";
  engine.pause();

  const playerHealth = Math.max(0, player.health);
  const enemyHealth = Math.max(0, enemy.health);

  let playerWon;
  if (playerHealth === enemyHealth) {
    playerWon = true; // Tie-break in favor of player
  } else {
    playerWon = playerHealth > enemyHealth;
  }

  endRound(playerWon);
}

function playSpecialHitSfx() {
  sfxDarkFighterSpawn.currentTime = 0;
  sfxDarkFighterSpawn.play().catch((e) => console.error("sfx blocked:", e));
}
