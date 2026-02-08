// js/tower-controller.js - Tower mode controller (UI & fight logic)
import { Engine } from "./core/engine.js";
import { Input } from "./core/input.js";
import { Player } from "./entities/player.js";
import { Enemy } from "./entities/enemy.js";
import { SpritePlayer } from "./entities/sprite-player.js";
import { SpriteEnemy } from "./entities/sprite-enemy.js";
import { DefenseHUD } from "./ui/defense-hud.js";
import { CHARACTER_TYPES } from "./character-types.js";
import { addFighterStyles } from "./ui/fighter-styles.js";

import {
  generateTowerEnemies,
  TOWER_ENEMIES,
  TOTAL_FLOORS,
  STORAGE_KEY,
} from "./tower-data.js";

class TowerModeController {
  constructor() {
    this.currentFloor = 1;
    this.unlockedFloor = 1;

    // Fight system
    this.engine = null;
    this.input = null;
    this.player = null;
    this.enemy = null;
    this.gameState = "idle";

    // Round system
    this.currentRound = 1;
    this.maxRounds = 3;
    this.playerWins = 0;
    this.enemyWins = 0;
    this.roundDuration = 90;
    this.roundTimeRemaining = this.roundDuration;
    this.roundTimerEl = null;

    // Hit registration
    this.hitRegistered = { player: false, enemy: false };

    // Game elements
    this.root = null;
    this.bgLayer = null;
    this.entitiesLayer = null;
    this.uiLayer = null;
    this.playerEl = null;
    this.enemyEl = null;
    this.playerHealthBar = null;
    this.enemyHealthBar = null;

    // Defense HUD
    this.playerDefenseHUD = null;
    this.enemyDefenseHUD = null;

    // Pause state
    this.pauseOverlay = null;

    // Constants
    this.BASE_WIDTH = 960;
    this.BASE_HEIGHT = 540;

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);

    // Initialize
    this.init();
  }

  // ==================== INITIALIZATION ====================

  init() {
    this.loadProgress();
    generateTowerEnemies(); // Generate random enemies
    this.updateUI();
    this.showScreen("tower-intro");
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedFloor = data.unlockedFloor || 1;
      }
    } catch (e) {
      console.error("Error loading tower progress:", e);
      this.unlockedFloor = 1;
    }
  }

  saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ unlockedFloor: this.unlockedFloor }),
      );
    } catch (e) {
      console.error("Error saving tower progress:", e);
    }
  }

  loadGameConfig() {
    try {
      const configStr = sessionStorage.getItem("gameConfig");
      if (configStr) {
        return JSON.parse(configStr);
      }
    } catch (e) {
      console.error("Error loading config:", e);
    }
    return null;
  }

  // ==================== SCREEN MANAGEMENT ====================

  showScreen(screenId) {
    document
      .querySelectorAll(".tower-screen")
      .forEach((s) => s.classList.remove("active"));
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add("active");
    }
  }

  updateUI() {
    // Update intro screen
    const progressInfo = document.getElementById("progress-info");
    const btnContinue = document.getElementById("btn-continue-tower");
    const continueFloor = document.getElementById("continue-floor");

    if (this.unlockedFloor > 1) {
      if (progressInfo) {
        progressInfo.classList.add("visible");
        progressInfo.innerHTML = `<p>🏆 Progress saved! Highest floor reached: ${this.unlockedFloor}</p>`;
      }
      if (btnContinue) {
        btnContinue.style.display = "block";
      }
      if (continueFloor) {
        continueFloor.textContent = this.unlockedFloor;
      }
    } else {
      if (progressInfo) {
        progressInfo.classList.remove("visible");
      }
      if (btnContinue) {
        btnContinue.style.display = "none";
      }
    }
  }

  // ==================== STATE TRANSITIONS ====================

  showIntro() {
    this.updateUI();
    this.showScreen("tower-intro");
  }

  startTower() {
    generateTowerEnemies(); // Regenerate random enemies for new run
    this.currentFloor = 1;
    this.showStageSelect();
  }

  continueTower() {
    this.currentFloor = this.unlockedFloor;
    this.showStageSelect();
  }

  showStageSelect() {
    this.updateStageSelectUI();
    this.showScreen("tower-stage-select");
  }

  updateStageSelectUI() {
    const enemyConfig = this.getScaledEnemyConfig(this.currentFloor);
    const charType =
      CHARACTER_TYPES[TOWER_ENEMIES[this.currentFloor].characterId];

    const stageTitle = document.getElementById("stage-title");
    if (stageTitle) {
      stageTitle.textContent = `FLOOR ${this.currentFloor}`;
    }

    const enemyCard = document.getElementById("enemy-preview-card");
    if (enemyCard) {
      if (enemyConfig.isBoss) {
        enemyCard.classList.add("boss-card");
      } else {
        enemyCard.classList.remove("boss-card");
      }
    }

    const spriteContainer = document.getElementById("enemy-sprite-container");
    if (spriteContainer && charType && charType.spriteConfig) {
      const idleSrc =
        charType.spriteConfig.basePath +
        charType.spriteConfig.animations.idle.src;
      spriteContainer.innerHTML = `<img src="${idleSrc}" alt="${enemyConfig.name}" style="transform: scaleX(-1);">`;
    } else if (spriteContainer) {
      spriteContainer.innerHTML = `<div class="sprite-placeholder">⚔️</div>`;
    }

    const nameEl = document.getElementById("enemy-name");
    if (nameEl) {
      nameEl.textContent = enemyConfig.name;
    }

    const diffEl = document.getElementById("enemy-difficulty");
    if (diffEl) {
      let diffText = "EASY";
      let diffClass = "";

      if (enemyConfig.isBoss) {
        diffText = "🔥 BOSS 🔥";
        diffClass = "boss";
      } else if (
        enemyConfig.difficulty === "hard" ||
        enemyConfig.difficulty === "expert"
      ) {
        diffText = "HARD";
        diffClass = "hard";
      } else if (enemyConfig.difficulty === "normal") {
        diffText = "MEDIUM";
      }

      diffEl.textContent = `DIFFICULTY: ${diffText}`;
      diffEl.className = `enemy-difficulty ${diffClass}`;
    }

    const healthStat = document.getElementById("enemy-health-stat");
    const defenseStat = document.getElementById("enemy-defense-stat");

    const healthPercent = Math.min(100, (enemyConfig.strength / 120) * 100);
    const defensePercent = Math.min(100, (enemyConfig.defense / 100) * 100);

    if (healthStat) {
      healthStat.style.width = `${healthPercent}%`;
    }
    if (defenseStat) {
      defenseStat.style.width = `${defensePercent}%`;
    }
  }

  // ==================== ENEMY SCALING ====================

  getScaledEnemyConfig(floor) {
    const base = TOWER_ENEMIES[floor];
    if (!base) return null;

    const scaleFactor = 1 + floor * 0.25;

    let strength = Math.round(base.baseStrength * scaleFactor);
    let speed = Math.round(base.baseSpeed * scaleFactor);
    let defense = base.baseDefense + floor * 2;

    if (base.isBoss) {
      strength = Math.round(strength * 1.5);
      defense = Math.round(defense * 1.3);
    }

    return { ...base, strength, speed, defense, floor };
  }

  // ==================== FIGHT SYSTEM ====================

  startFight() {
    this.currentRound = 1;
    this.playerWins = 0;
    this.enemyWins = 0;
    this.roundTimeRemaining = this.roundDuration;
    this.roundTimerEl = null;

    this.showScreen("tower-fight");
    this.initFight();
  }

  initFight() {
    const enemyConfig = this.getScaledEnemyConfig(this.currentFloor);
    const config = this.loadGameConfig();
    const charType = CHARACTER_TYPES[enemyConfig.characterId];

    const floorDisplay = document.getElementById("current-floor-display");
    if (floorDisplay) {
      floorDisplay.textContent = `Floor ${this.currentFloor}`;
    }

    this.root = document.getElementById("tower-game");
    this.root.innerHTML = "";

    Object.assign(this.root.style, {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      background: "#1a1a1a",
    });

    this.bgLayer = document.createElement("div");
    this.entitiesLayer = document.createElement("div");
    this.uiLayer = document.createElement("div");

    [this.bgLayer, this.entitiesLayer, this.uiLayer].forEach((l) => {
      Object.assign(l.style, {
        position: "absolute",
        inset: "0",
        width: this.BASE_WIDTH + "px",
        height: this.BASE_HEIGHT + "px",
        transformOrigin: "top left",
      });
    });

    const maps = [
    "assets/maps/Alhabash Underground Garage.png",
    "assets/maps/Ashfall Arcade.png",
    "assets/maps/Blackout Stage.png",
    "assets/maps/Bytefall Cafeteria.png",
    "assets/maps/Day in the Garage.png",
    "assets/maps/hamanyy map.png",
    "assets/maps/Hanon's Quiet Slumber.png",
    "assets/maps/Jamil's Last Stand.png",
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

    const randomMap = maps[Math.floor(Math.random() * maps.length)];

    this.bgLayer.style.backgroundImage = `url('${randomMap}')`;
    this.bgLayer.style.backgroundSize = "100% 100%";
    this.bgLayer.style.backgroundPosition = "center";
    this.bgLayer.style.backgroundRepeat = "no-repeat";

    this.root.appendChild(this.bgLayer);
    this.root.appendChild(this.entitiesLayer);
    this.root.appendChild(this.uiLayer);

    addFighterStyles();
    this.updateScale();
    window.addEventListener("resize", () => this.updateScale());

    this.input = new Input();

    const charId = config?.character?.id || "4";
    const playerCharType = CHARACTER_TYPES[charId] || CHARACTER_TYPES[4];

    if (playerCharType.useSprite) {
      const playerScale = playerCharType.customScale || 2.5;
      this.player = new SpritePlayer({
        name: config?.character?.name || playerCharType.name || "Player",
        x: 150,
        y: 300,
        strength: parseInt(config?.character?.strength) || 75,
        speed: parseInt(config?.character?.speed) || 80,
        defense: parseInt(config?.character?.defense) || 65,
        facing: 1,
        scale: playerScale,
        spriteConfig: playerCharType.spriteConfig,
      });
    } else {
      this.player = new Player({
        name: config?.character?.name || playerCharType.name || "Player",
        x: 150,
        y: 400,
        characterType: playerCharType.type,
        strength: parseInt(config?.character?.strength) || 70,
        speed: parseInt(config?.character?.speed) || 70,
        defense: parseInt(config?.character?.defense) || 70,
        facing: 1,
      });
    }

    if (charType && charType.useSprite) {
      const enemyScale = charType.customScale || 2.5;
      this.enemy = new SpriteEnemy({
        name: enemyConfig.name,
        x: 650,
        y: 300,
        strength: enemyConfig.strength,
        speed: enemyConfig.speed,
        defense: enemyConfig.defense,
        facing: -1,
        difficulty: enemyConfig.difficulty,
        aggressiveness: enemyConfig.aggressiveness,
        scale: enemyScale,
        spriteConfig: charType.spriteConfig,
      });
    } else {
      this.enemy = new Enemy({
        name: enemyConfig.name,
        x: 680,
        y: 400,
        characterType: charType?.type || "warrior",
        strength: enemyConfig.strength,
        speed: enemyConfig.speed,
        defense: enemyConfig.defense,
        facing: -1,
        difficulty: enemyConfig.difficulty,
        aggressiveness: enemyConfig.aggressiveness,
      });
    }

    this.playerEl = document.createElement("div");
    this.playerEl.className = "fighter player";
    this.enemyEl = document.createElement("div");
    this.enemyEl.className = "fighter enemy";

    this.entitiesLayer.appendChild(this.playerEl);
    this.entitiesLayer.appendChild(this.enemyEl);

    this.player.attach(this.playerEl);
    this.enemy.attach(this.enemyEl);

    this.createHealthBars(enemyConfig.name);
    this.createFightHUD(enemyConfig);
    this.createDefenseHUD();
    this.createPauseOverlay();

    this.engine = new Engine(this.update, this.render);

    window.addEventListener("keydown", this.handleKeyDown);

    this.showFightIntro(enemyConfig, () => {
      this.gameState = "playing";
      this.engine.start();
    });
  }

  handleKeyDown(e) {
    if (e.key === "Escape") {
      this.togglePause();
    }
  }

  createHealthBars(enemyName) {
    const playerContainer = document.createElement("div");
    Object.assign(playerContainer.style, {
      position: "absolute",
      top: "60px",
      left: "20px",
      width: "300px",
    });

    const config = this.loadGameConfig();
    const playerLabel = document.createElement("div");
    playerLabel.textContent = config?.character?.name || "PLAYER";
    playerLabel.style.cssText =
      "color: #fff; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold; text-shadow: 1px 1px 2px black;";

    const playerBarBg = document.createElement("div");
    playerBarBg.style.cssText =
      "width: 100%; height: 25px; background: rgba(0,0,0,0.5); border: 2px solid #fff; border-radius: 5px; overflow: hidden;";

    this.playerHealthBar = document.createElement("div");
    this.playerHealthBar.style.cssText =
      "width: 100%; height: 100%; background: linear-gradient(90deg, #00ff00, #88ff00); transition: width 0.3s;";

    playerBarBg.appendChild(this.playerHealthBar);
    playerContainer.appendChild(playerLabel);
    playerContainer.appendChild(playerBarBg);
    this.uiLayer.appendChild(playerContainer);

    const enemyContainer = document.createElement("div");
    Object.assign(enemyContainer.style, {
      position: "absolute",
      top: "60px",
      right: "20px",
      width: "300px",
      textAlign: "right",
    });

    const enemyLabel = document.createElement("div");
    enemyLabel.textContent = enemyName.toUpperCase();
    enemyLabel.style.cssText =
      "color: #fff; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold; text-shadow: 1px 1px 2px black;";

    const enemyBarBg = document.createElement("div");
    enemyBarBg.style.cssText =
      "width: 100%; height: 25px; background: rgba(0,0,0,0.5); border: 2px solid #fff; border-radius: 5px; overflow: hidden;";

    this.enemyHealthBar = document.createElement("div");
    this.enemyHealthBar.style.cssText =
      "width: 100%; height: 100%; background: linear-gradient(90deg, #ff4400, #ff0000); transition: width 0.3s; margin-left: auto;";

    enemyBarBg.appendChild(this.enemyHealthBar);
    enemyContainer.appendChild(enemyLabel);
    enemyContainer.appendChild(enemyBarBg);
    this.uiLayer.appendChild(enemyContainer);
  }

  createFightHUD(enemyConfig) {
    const hud = document.createElement("div");
    hud.id = "tower-fight-ui-hud";
    Object.assign(hud.style, {
      position: "absolute",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      color: enemyConfig.isBoss ? "#ff0000" : "#ff9900",
      fontSize: "1rem",
      fontFamily: "'Arial Black', sans-serif",
      textAlign: "center",
      textShadow: "0 0 10px rgba(0,0,0,0.8)",
    });
    const timer = document.createElement("div");
    timer.id = "tower-round-timer";
    timer.style.cssText =
      "font-size: 1.4rem; font-weight: 900; letter-spacing: 2px; margin-bottom: 6px;";
    timer.textContent = this.formatTime(this.roundTimeRemaining);
    this.roundTimerEl = timer;

    hud.innerHTML = `
        <div id="tower-round-label" style="font-size: 0.9rem; color: #888;">ROUND ${this.currentRound}/${this.maxRounds}</div>
            <div id="tower-round-wins" style="font-size: 0.8rem; margin-top: 5px;">
                <span style="color: #00aaff;">●</span> ${this.playerWins} - ${this.enemyWins} <span style="color: #ff4400;">●</span>
            </div>
        `;
    hud.insertBefore(timer, hud.firstChild);
    this.uiLayer.appendChild(hud);
  }

  createDefenseHUD() {
    this.playerDefenseHUD = new DefenseHUD(this.uiLayer, true);
    this.enemyDefenseHUD = new DefenseHUD(this.uiLayer, false);
  }

  createPauseOverlay() {
    this.pauseOverlay = document.createElement("div");
    this.pauseOverlay.className = "tower-pause-overlay";

    const panel = document.createElement("div");
    panel.className = "pause-panel";

    panel.innerHTML = `
            <div class="pause-title">PAUSED</div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button class="tower-btn start" id="pause-continue">▶ CONTINUE</button>
                <button class="tower-btn restart" id="pause-restart">↩️ RESTART FLOOR</button>
                <button class="tower-btn exit" id="pause-exit">← EXIT TOWER</button>
            </div>
        `;

    this.pauseOverlay.appendChild(panel);
    document.body.appendChild(this.pauseOverlay);

    document
      .getElementById("pause-continue")
      .addEventListener("click", () => this.resumeGame());
    document
      .getElementById("pause-restart")
      .addEventListener("click", () => this.retryFloor());
    document
      .getElementById("pause-exit")
      .addEventListener("click", () => this.exitTower());
  }

  showFightIntro(enemyConfig, callback) {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.95)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "9999",
    });

    const config = this.loadGameConfig();
    const stageColor = enemyConfig.isBoss ? "#ff0000" : "#ff9900";

    overlay.innerHTML = `
            <div style="font-size: 1.2rem; color: #666; margin-bottom: 10px; letter-spacing: 5px;">
                ${enemyConfig.isBoss
        ? "🔥 BOSS FLOOR 🔥"
        : `FLOOR ${this.currentFloor}`
      }
            </div>
            <div style="font-size: 2rem; color: #00aaff; margin-bottom: 20px;">
                ${config?.character?.name || "PLAYER"}
            </div>
            <div style="font-size: 4rem; color: ${stageColor}; animation: pulse 0.5s infinite;" class="vs-text">VS</div>
            <div style="font-size: 2rem; color: ${stageColor}; margin-top: 20px;">
                ${enemyConfig.name.toUpperCase()}
            </div>
        `;

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.transition = "opacity 0.5s";
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
        callback();
      }, 500);
    }, 2500);
  }

  updateScale() {
    if (!this.root) return;
    const scaleX = this.root.offsetWidth / this.BASE_WIDTH;
    const scaleY = this.root.offsetHeight / this.BASE_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    [this.bgLayer, this.entitiesLayer, this.uiLayer].forEach((l) => {
      if (l) l.style.transform = `scale(${scale})`;
    });
  }

  togglePause() {
    if (this.gameState === "paused") {
      this.resumeGame();
    } else if (this.gameState === "playing") {
      this.pauseGame();
    }
  }

  pauseGame() {
    if (this.gameState !== "playing") return;
    this.gameState = "paused";
    if (this.pauseOverlay) this.pauseOverlay.classList.add("active");
    if (this.engine) this.engine.pause();
  }

  resumeGame() {
    if (this.gameState !== "paused") return;
    this.gameState = "playing";
    if (this.pauseOverlay) this.pauseOverlay.classList.remove("active");
    if (this.engine) this.engine.resume();
  }

  // ==================== GAME LOOP ====================

  update(dt) {
    if (this.gameState !== "playing") return;

    this.roundTimeRemaining = Math.max(0, this.roundTimeRemaining - dt);
    this.updateRoundTimerUI();

    if (this.roundTimeRemaining <= 0) {
      this.handleTimeUp();
      return;
    }

    this.player.update(dt, this.input, this.enemy);
    this.enemy.update(dt, this.input, this.player);

    this.input.update();

    if (!this.player.attackBox.active) {
      this.hitRegistered.player = false;
    }
    if (!this.enemy.attackBox.active) {
      this.hitRegistered.enemy = false;
    }

    if (this.player.isAttackHitting(this.enemy) && !this.hitRegistered.player) {
      const damageResult = this.enemy.takeDamage(
        this.player.attackBox.damage,
        this.player,
      );
      const damage =
        typeof damageResult === "object" ? damageResult.damage : damageResult;

      this.hitRegistered.player = true;

      if (damage > 0) {
        this.showHitEffect(this.enemy);
        if (typeof damageResult === "object" && !damageResult.blocked) {
          this.player.defenseSystem.registerHit();
        }
      }

      if (typeof damageResult === "object") {
        if (damageResult.blocked) {
          this.showBlockEffect(this.enemy, damageResult.perfectBlock);
        }
      }
    }

    if (this.enemy.isAttackHitting(this.player) && !this.hitRegistered.enemy) {
      const damageResult = this.player.takeDamage(
        this.enemy.attackBox.damage,
        this.enemy,
      );
      const damage =
        typeof damageResult === "object" ? damageResult.damage : damageResult;

      this.hitRegistered.enemy = true;

      if (damage > 0) {
        this.showHitEffect(this.player);
        if (typeof damageResult === "object" && !damageResult.blocked) {
          this.enemy.defenseSystem.registerHit();
        }
      }

      if (typeof damageResult === "object") {
        if (damageResult.blocked) {
          this.showBlockEffect(this.player, damageResult.perfectBlock);
        }
      }
    }

    this.updateHealthBars();
    this.updateDefenseHUD();

    if (this.player.health <= 0) {
      this.gameState = "ended";
      this.engine.pause();
      this.enemyWins++;
      this.handleRoundEnd(false);
    } else if (this.enemy.health <= 0) {
      this.gameState = "ended";
      this.engine.pause();
      this.playerWins++;
      this.handleRoundEnd(true);
    }
  }

  render() {
    this.player.render(false);
    this.enemy.render(false);
  }

  // ==================== VISUAL EFFECTS ====================

  showHitEffect(fighter) {
    if (fighter.el) {
      const body = fighter.el.querySelector(".fighter-body");
      if (body) {
        body.classList.add("hit-flash");
        setTimeout(() => body.classList.remove("hit-flash"), 300);
      } else {
        fighter.el.classList.add("hit-flash");
        setTimeout(() => fighter.el.classList.remove("hit-flash"), 300);
      }
    }
  }

  showBlockEffect(fighter, isPerfect) {
    if (fighter.el) {
      const effectClass = isPerfect ? "perfect-block-flash" : "block-flash";
      fighter.el.classList.add(effectClass);
      setTimeout(() => fighter.el.classList.remove(effectClass), 150);
    }
  }

  updateHealthBars() {
    if (this.playerHealthBar) {
      const playerHealthPercent = Math.max(0, this.player.health);
      this.playerHealthBar.style.width = playerHealthPercent + "%";

      if (playerHealthPercent < 30) {
        this.playerHealthBar.style.background =
          "linear-gradient(90deg, #ff0000, #ff4400)";
      } else if (playerHealthPercent < 60) {
        this.playerHealthBar.style.background =
          "linear-gradient(90deg, #ffaa00, #ffff00)";
      } else {
        this.playerHealthBar.style.background =
          "linear-gradient(90deg, #00ff00, #88ff00)";
      }
    }
    if (this.enemyHealthBar) {
      this.enemyHealthBar.style.width = Math.max(0, this.enemy.health) + "%";
    }
  }

  updateDefenseHUD() {
    if (this.playerDefenseHUD && this.player.defenseSystem) {
      this.playerDefenseHUD.update(this.player.defenseSystem);
      this.updateFighterDefenseVisuals(this.player);
    }

    if (this.enemyDefenseHUD && this.enemy.defenseSystem) {
      this.enemyDefenseHUD.update(this.enemy.defenseSystem);
      this.updateFighterDefenseVisuals(this.enemy);
    }
  }

  updateFighterDefenseVisuals(fighter) {
    if (!fighter || !fighter.el || !fighter.defenseSystem) return;

    const ds = fighter.defenseSystem;

    fighter.el.classList.toggle("invincible", ds.isInvincible);

    if (ds.perfectBlockFlashTimer > 0) {
      fighter.el.classList.add("perfect-block-flash");
    } else {
      fighter.el.classList.remove("perfect-block-flash");
    }
  }

  // ==================== ROUND MANAGEMENT ====================

  handleRoundEnd(playerWon, reason) {
    const winsNeeded = Math.ceil(this.maxRounds / 2);

    if (this.playerWins >= winsNeeded) {
      this.handleStageVictory();
    } else if (this.enemyWins >= winsNeeded) {
      this.handleDefeat();
    } else {
      this.currentRound++;
      this.showRoundEnd(playerWon, reason);
    }
  }

  showRoundEnd(playerWon, reason = null) {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.9)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "9999",
    });

    const isDraw = playerWon === null;
    const resultColor = isDraw ? "#ffaa00" : playerWon ? "#00ff00" : "#ff0000";
    const resultText = isDraw
      ? "ROUND DRAW"
      : playerWon
        ? "ROUND WON"
        : "ROUND LOST";
    const reasonLine = reason
      ? `<div style="font-size: 1rem; color: #ccc; margin-top: 6px;">${reason}</div>`
      : "";

    overlay.innerHTML = `
            <div style="font-size: 3rem; color: ${resultColor}; font-family: 'Arial Black', sans-serif; margin-bottom: 20px; text-shadow: 0 0 20px ${resultColor};">
                ${resultText}
            </div>
            <div style="font-size: 1.5rem; color: #fff; font-family: 'Arial Black', sans-serif; margin-bottom: 10px;">
                ROUND ${this.currentRound - 1}
            </div>
            <div style="font-size: 1.2rem; color: #ff9900; font-family: 'Arial', sans-serif;">
                Score: ${this.playerWins} - ${this.enemyWins}
            </div>
          ${reasonLine}
            <div style="font-size: 1rem; color: #888; margin-top: 20px;">
                Next round starting...
            </div>
        `;

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.transition = "opacity 0.5s";
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
        this.startNextRound();
      }, 500);
    }, 2000);
  }

  startNextRound() {
    this.player.reset(150);
    this.enemy.reset(680);

    this.roundTimeRemaining = this.roundDuration;
    this.updateRoundTimerUI();
    this.hitRegistered = { player: false, enemy: false };

    this.updateRoundHUD();

    this.gameState = "playing";
    this.engine.resume();
  }

  updateRoundTimerUI() {
    const timerEl =
      this.roundTimerEl || document.getElementById("tower-round-timer");
    if (timerEl) {
      timerEl.textContent = this.formatTime(this.roundTimeRemaining);
    }
  }

  updateRoundHUD() {
    const roundWins = document.getElementById("tower-round-wins");
    if (roundWins) {
      roundWins.innerHTML = `<span style="color: #00aaff;">●</span> ${this.playerWins} - ${this.enemyWins} <span style="color: #ff4400;">●</span>`;
    }
    const hud = document.getElementById("tower-fight-ui-hud");
    if (hud) {
      const roundDiv = document.getElementById("tower-round-label");
      if (roundDiv) {
        roundDiv.textContent = `ROUND ${this.currentRound}/${this.maxRounds}`;
      }
    }
    this.updateRoundTimerUI();
  }

  handleTimeUp() {
    if (this.gameState !== "playing") return;

    this.gameState = "ended";
    if (this.engine) this.engine.pause();

    const playerHealth = Math.max(0, this.player.health);
    const enemyHealth = Math.max(0, this.enemy.health);

    let playerWon = null;
    if (playerHealth > enemyHealth) {
      playerWon = true;
      this.playerWins++;
    } else if (enemyHealth > playerHealth) {
      playerWon = false;
      this.enemyWins++;
    }

    if (playerWon === null) {
      this.currentRound++;
      this.showRoundEnd(null, "TIME UP - DRAW");
    } else {
      this.handleRoundEnd(playerWon, "TIME UP");
    }
  }

  formatTime(seconds) {
    const clamped = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  // ==================== VICTORY & DEFEAT ====================

  handleStageVictory() {
    this.cleanup();

    if (this.currentFloor >= this.unlockedFloor) {
      this.unlockedFloor = Math.min(this.currentFloor + 1, TOTAL_FLOORS + 1);
      this.saveProgress();
    }

    if (this.currentFloor >= TOTAL_FLOORS) {
      this.showTowerComplete();
    } else {
      this.showStageVictory();
    }
  }

  showStageVictory() {
    const title = document.getElementById("stage-victory-title");
    if (title) {
      title.textContent = `FLOOR ${this.currentFloor} CLEARED!`;
    }

    const floorInfo = document.getElementById("cleared-floor");
    if (floorInfo) {
      floorInfo.textContent = `Floor ${this.currentFloor} Complete`;
    }

    this.showScreen("tower-stage-victory");
  }

  showTowerComplete() {
    this.showScreen("tower-complete");
  }

  handleDefeat() {
    this.cleanup();

    const floorInfo = document.getElementById("defeat-floor");
    if (floorInfo) {
      floorInfo.textContent = `Fell at Floor ${this.currentFloor}`;
    }

    this.showScreen("tower-defeat");
  }

  // ==================== NAVIGATION ====================

  nextFloor() {
    this.currentFloor++;
    this.showStageSelect();
  }

  retryFloor() {
    this.cleanup();
    this.showScreen("tower-fight");
    this.currentRound = 1;
    this.playerWins = 0;
    this.enemyWins = 0;
    this.initFight();
  }

  restartTower() {
    this.cleanup();
    generateTowerEnemies();
    this.currentFloor = 1;
    this.showStageSelect();
  }

  exitTower() {
    this.cleanup();
    window.location.href = "home.html";
  }

  cleanup() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("resize", () => this.updateScale());

    if (this.engine) {
      this.engine.pause();
      this.engine = null;
    }

    if (this.pauseOverlay) {
      this.pauseOverlay.remove();
      this.pauseOverlay = null;
    }

    if (this.root) {
      this.root.innerHTML = "";
    }

    this.player = null;
    this.enemy = null;
    this.input = null;
  }
}

// ==================== INITIALIZATION ====================

const TowerMode = new TowerModeController();

window.TowerMode = TowerMode;

window.enterTowerMode = function () {
  window.location.href = "tower.html";
};

export { TowerMode, TowerModeController };
