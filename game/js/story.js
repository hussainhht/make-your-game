import { Engine } from "./core/engine.js";
import { Input } from "./core/input.js";
import { Player } from "./entities/player.js";
import { Enemy } from "./entities/enemy.js";
import { SpritePlayer } from "./entities/sprite-player.js";
import { SpriteEnemy } from "./entities/sprite-enemy.js";
import { DefenseHUD, DefenseScreenEffects } from "./ui/defense-hud.js";
import { CHARACTER_TYPES } from "./character-types.js";
import { addFighterStyles } from "./ui/fighter-styles.js";
import { AuditsManager } from "./core/audits-manager.js";

let currentScene = "scene-prologue";
let currentFight = 0;
let totalScore = 0;
let engine, input, player, enemy;
let gameState = "idle";

// Round system
let currentRound = 1;
let maxRounds = 3;
let playerWins = 0;
let enemyWins = 0;

let hitRegistered = { player: false, enemy: false };

let playerDefenseHUD, enemyDefenseHUD, defenseScreenEffects;

// Audit system
let auditsManager = null;
let auditHUD = null;
let isAuditMode = false;

let root, bgLayer, entitiesLayer, uiLayer;
let playerEl, enemyEl;
let playerHealthBar, enemyHealthBar;

const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;

const fights = [
  null,
  {
    name: "Hitler Bot",
    type: "enemy",
    strength: 60,
    speed: 50,
    defense: 45,
    difficulty: "medium",
    aggressiveness: 0.5,
    useSprite: false,
    victoryScene: "scene-hitler-bot-victory",
    defeatMessage:
      "I wish I had seen you in the selection pool… instead of watching your programming life die here.",
  },
  {
    name: "Yaman",
    type: "boss",
    strength: 70,
    speed: 60,
    defense: 55,
    difficulty: "hard",
    aggressiveness: 0.75,
    useSprite: true,
    isAudit: true,
    auditCount: 3,
    auditEnemyHP: 70,
    victoryScene: "scene-yaman-victory",
    defeatMessage: "Your programming life has ended here… as I warned.",
  },
  {
    name: "Ahmed Abdeen",
    type: "boss",
    strength: 55,
    speed: 55,
    defense: 40,
    difficulty: "normal",
    aggressiveness: 0.6,
    useSprite: true,
    isAudit: true,
    auditCount: 10,
    auditEnemyHP: 50,
    victoryScene: "scene-accepted",
    defeatMessage: "Your code could not survive production. Rejected.",
  },
];

function loadGameConfig() {
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

function goToScene(sceneId) {
  document
    .querySelectorAll(".story-scene")
    .forEach((s) => s.classList.remove("active"));
  const nextScene = document.getElementById(sceneId);
  if (nextScene) {
    nextScene.classList.add("active");
    currentScene = sceneId;
  }
}

function withdrawStory() {
  window.location.href = "home.html";
}

function retreatToMenu() {
  window.location.href = "home.html";
}

function startFight(fightNum) {
  currentFight = fightNum;
  currentRound = 1;
  playerWins = 0;
  enemyWins = 0;

  const fightConfig = fights[fightNum];

  // Route audit-type fights to the audit system
  if (fightConfig && fightConfig.isAudit) {
    startAuditFight(fightNum);
    return;
  }

  document.getElementById("story-container").style.display = "none";
  document.getElementById("fight-container").classList.add("active");
  initFight(fightNum);
}

function startAuditFight(fightNum) {
  currentFight = fightNum;
  currentRound = 1;
  playerWins = 0;
  enemyWins = 0;
  isAuditMode = true;
  document.getElementById("story-container").style.display = "none";
  document.getElementById("fight-container").classList.add("active");
  initAuditFight(fightNum);
}

function initAuditFight(fightNum) {
  const fightConfig = fights[fightNum];
  const config = loadGameConfig();

  root = document.getElementById("game");
  root.innerHTML = "";

  Object.assign(root.style, {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#1a1a1a",
  });

  bgLayer = document.createElement("div");
  entitiesLayer = document.createElement("div");
  uiLayer = document.createElement("div");

  [bgLayer, entitiesLayer, uiLayer].forEach((l) => {
    Object.assign(l.style, {
      position: "absolute",
      inset: "0",
      width: BASE_WIDTH + "px",
      height: BASE_HEIGHT + "px",
      transformOrigin: "top left",
    });
  });

  bgLayer.style.backgroundImage = "url('assets/background.png')";
  bgLayer.style.backgroundSize = "100% 100%";
  bgLayer.style.backgroundPosition = "center";
  bgLayer.style.backgroundRepeat = "no-repeat";

  root.appendChild(bgLayer);
  root.appendChild(entitiesLayer);
  root.appendChild(uiLayer);

  addFighterStyles();
  updateScale();
  window.addEventListener("resize", updateScale);

  input = new Input();

  // --- Create player (same as normal fight) ---
  const charId = config?.character?.id || "1";
  const charType = CHARACTER_TYPES[charId] || CHARACTER_TYPES[1];

  if (charType.useSprite) {
    const playerScale = charType.customScale || 2.5;
    player = new SpritePlayer({
      name: config?.character?.name || charType.name || "Player",
      x: 150,
      y: 300,
      strength: parseInt(config?.character?.strength) || 75,
      speed: parseInt(config?.character?.speed) || 80,
      defense: parseInt(config?.character?.defense) || 65,
      facing: 1,
      scale: playerScale,
      spriteConfig: charType.spriteConfig,
    });
  } else {
    player = new Player({
      name: config?.character?.name || charType.name || "Player",
      x: 150,
      y: 400,
      characterType: charType.type,
      strength: parseInt(config?.character?.strength) || 70,
      speed: parseInt(config?.character?.speed) || 70,
      defense: parseInt(config?.character?.defense) || 70,
      facing: 1,
    });
  }

  playerEl = document.createElement("div");
  playerEl.className = "fighter player";
  entitiesLayer.appendChild(playerEl);
  player.attach(playerEl);

  // --- Create AuditsManager ---
  auditsManager = new AuditsManager({
    totalAudits: fightConfig.auditCount,
    enemyHP: fightConfig.auditEnemyHP,
    label: fightConfig.name.toUpperCase(),
    difficulty: fightConfig.difficulty,
    enemyStrength: fightConfig.strength,
    enemySpeed: fightConfig.speed,
    enemyDefense: fightConfig.defense,
    onAuditStart: (idx, total, enemyName) => {
      updateAuditHUD(idx, total, enemyName);
      showAuditBanner(idx, total, enemyName);
    },
    onAuditEnd: (idx, total) => {
      totalScore += 300;
    },
    onAllComplete: () => {
      totalScore += 2000;
      showAuditVictory();
    },
    onPlayerDied: () => {
      showAuditDefeat();
    },
  });

  // Spawn first audit enemy
  const firstSpawn = auditsManager.start();
  enemy = firstSpawn.enemy;
  enemyEl = firstSpawn.enemyEl;
  entitiesLayer.appendChild(enemyEl);
  enemy.attach(enemyEl);

  createHealthBars(enemy.name || fightConfig.name);
  createAuditHUD(fightNum, fightConfig.name, auditsManager);
  createDefenseHUD();
  createPauseOverlay();

  engine = new Engine(updateAudit, render);

  window.addEventListener("keydown", handleKeyDown);

  showFightIntro(fightNum, fightConfig.name, () => {
    gameState = "playing";
    engine.start();
  });
}

function createAuditHUD(fightNum, bossName, manager) {
  auditHUD = document.createElement("div");
  auditHUD.id = "audit-hud";
  Object.assign(auditHUD.style, {
    position: "absolute",
    top: "10px",
    left: "50%",
    transform: "none",
    color: "#ff9900",
    fontSize: "1.2rem",
    fontFamily: "'Arial Black', sans-serif",
    textShadow: "0 0 10px rgba(255,153,0,0.8)",
    textAlign: "center",
    zIndex: "50",
  });
  auditHUD.innerHTML = `
    <div style="font-size:0.9rem; color:#888;">${bossName.toUpperCase()}'S AUDITS</div>
    <div id="audit-progress" style="font-size:1.4rem; color:#ff9900; margin-top:5px;">AUDIT 1/${manager.totalAudits}</div>
    <div id="audit-enemy-name" style="font-size:0.8rem; color:#ff4400; margin-top:3px;"></div>
  `;
  uiLayer.appendChild(auditHUD);
}

function updateAuditHUD(idx, total, enemyName) {
  const prog = document.getElementById("audit-progress");
  if (prog) prog.textContent = `AUDIT ${idx}/${total}`;
  const nameEl = document.getElementById("audit-enemy-name");
  if (nameEl) nameEl.textContent = `VS ${(enemyName || "").toUpperCase()}`;

  // Update enemy health bar label
  const enemyLabels = uiLayer?.querySelectorAll(
    "div[style*='text-align: right'] > div:first-child",
  );
  // Simpler: just update via a known id
  const enemyLabelEl = document.getElementById("enemy-name-label");
  if (enemyLabelEl)
    enemyLabelEl.textContent = (enemyName || "ENEMY").toUpperCase();
}

function showAuditBanner(idx, total, enemyName) {
  const banner = document.createElement("div");
  Object.assign(banner.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.7)",
    zIndex: "9999",
    pointerEvents: "none",
  });
  banner.innerHTML = `
    <div style="font-size:3rem; color:#ff9900; font-family:'Arial Black',sans-serif; text-shadow:0 0 20px rgba(255,153,0,0.6);">
      AUDIT ${idx}/${total}
    </div>
    <div style="font-size:1.5rem; color:#ff4400; font-family:'Arial Black',sans-serif; margin-top:10px;">
      VS ${(enemyName || "").toUpperCase()}
    </div>
  `;
  document.body.appendChild(banner);
  setTimeout(() => {
    banner.style.transition = "opacity 0.4s";
    banner.style.opacity = "0";
    setTimeout(() => banner.remove(), 400);
  }, 1000);
}

function updateAudit(dt) {
  if (gameState !== "playing") return;

  player.update(dt, input, enemy);
  enemy.update(dt, input, player);
  input.update();

  if (!player.attackBox.active) hitRegistered.player = false;
  if (!enemy.attackBox.active) hitRegistered.enemy = false;

  // Player hits enemy
  if (player.isAttackHitting(enemy) && !hitRegistered.player) {
    const damageResult = enemy.takeDamage(player.attackBox.damage, player);
    const damage =
      typeof damageResult === "object" ? damageResult.damage : damageResult;
    hitRegistered.player = true;
    if (damage > 0) {
      totalScore += damage * 10;
      showHitEffect(enemy);
      if (typeof damageResult === "object" && !damageResult.blocked) {
        player.defenseSystem.registerHit();
      }
    }
    if (typeof damageResult === "object" && damageResult.blocked) {
      showBlockEffect(enemy, damageResult.perfectBlock);
    }
  }

  // Enemy hits player
  if (enemy.isAttackHitting(player) && !hitRegistered.enemy) {
    const damageResult = player.takeDamage(enemy.attackBox.damage, enemy);
    const damage =
      typeof damageResult === "object" ? damageResult.damage : damageResult;
    hitRegistered.enemy = true;
    if (damage > 0) {
      showHitEffect(player);
      if (typeof damageResult === "object" && !damageResult.blocked) {
        enemy.defenseSystem.registerHit();
      }
    }
    if (typeof damageResult === "object" && damageResult.blocked) {
      showBlockEffect(player, damageResult.perfectBlock);
    }
  }

  updateHealthBars();
  updateDefenseHUD();

  // --- AUDIT: enemy dies -> spawn next ---
  if (enemy.health <= 0) {
    // Destroy old enemy element
    if (enemyEl && enemyEl.parentNode) enemyEl.parentNode.removeChild(enemyEl);
    if (enemy.destroy) enemy.destroy();

    const nextSpawn = auditsManager.enemyDefeated();
    if (nextSpawn) {
      // Spawn next enemy without resetting player
      enemy = nextSpawn.enemy;
      enemyEl = nextSpawn.enemyEl;
      entitiesLayer.appendChild(enemyEl);
      enemy.attach(enemyEl);

      // Reset enemy HUD
      if (enemyDefenseHUD) {
        enemyDefenseHUD.destroy();
        enemyDefenseHUD = new DefenseHUD(uiLayer, false);
      }

      // Update enemy health bar to full for new enemy
      if (enemyHealthBar) {
        enemyHealthBar.style.width = "100%";
      }

      hitRegistered.player = false;
      hitRegistered.enemy = false;
    }
    // else: auditsManager already called onAllComplete or we're done
    return;
  }

  // --- AUDIT: player dies -> fail ---
  if (player.health <= 0) {
    gameState = "ended";
    engine.pause();
    auditsManager.playerDied();
    return;
  }
}

function showAuditVictory() {
  gameState = "ended";
  engine.pause();

  const fightConfig = fights[currentFight];
  setTimeout(() => {
    document.getElementById("fight-container").classList.remove("active");
    document.getElementById("story-container").style.display = "flex";
    goToScene(fightConfig.victoryScene);
    isAuditMode = false;
    auditsManager = null;
  }, 1500);
}

function showAuditDefeat() {
  gameState = "ended";
  engine.pause();

  const fightConfig = fights[currentFight];
  const auditProgress = auditsManager ? auditsManager.getProgressText() : "";

  const overlay = document.createElement("div");
  overlay.className = "result-screen";
  overlay.id = "defeat-overlay";

  overlay.innerHTML = `
    <div class="result-title failed">AUDIT FAILED</div>
    <div class="result-subtitle">You did not survive the audits.</div>
    <div style="font-size: 1.2rem; color: #ff9900; margin-bottom: 10px;">
      ${auditProgress}
    </div>
    <div style="font-size: 1rem; color: #888; margin-bottom: 20px;">
      Score: ${totalScore}
    </div>
    <div class="dialog-box enemy-dialog" style="max-width: 600px; margin-bottom: 40px;">
      <span class="dialog-speaker enemy-speaker">${fightConfig.name.toUpperCase()}</span>
      <p class="story-text" style="margin: 0; text-align: left; font-size: 1.1rem;">
        "${fightConfig.defeatMessage}"
      </p>
    </div>
    <button class="continue-btn danger" id="retry-audit-btn" style="margin-bottom: 15px;">
      ⚔️ RETRY AUDITS
    </button>
    <button class="continue-btn withdraw" id="back-to-menu-audit-btn">
      🏠 MAIN MENU
    </button>
  `;

  document.body.appendChild(overlay);

  document.getElementById("retry-audit-btn").addEventListener("click", () => {
    overlay.remove();
    isAuditMode = false;
    auditsManager = null;
    const gameEl = document.getElementById("game");
    if (gameEl) gameEl.innerHTML = "";
    window.removeEventListener("keydown", handleKeyDown);
    initAuditFight(currentFight);
  });
  document
    .getElementById("back-to-menu-audit-btn")
    .addEventListener("click", () => {
      window.location.href = "home.html";
    });
}

function initFight(fightNum) {
  const fightConfig = fights[fightNum];
  const config = loadGameConfig();

  root = document.getElementById("game");
  root.innerHTML = "";

  Object.assign(root.style, {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#1a1a1a",
  });

  bgLayer = document.createElement("div");
  entitiesLayer = document.createElement("div");
  uiLayer = document.createElement("div");

  [bgLayer, entitiesLayer, uiLayer].forEach((l) => {
    Object.assign(l.style, {
      position: "absolute",
      inset: "0",
      width: BASE_WIDTH + "px",
      height: BASE_HEIGHT + "px",
      transformOrigin: "top left",
    });
  });

  bgLayer.style.backgroundImage = "url('assets/background.png')";
  bgLayer.style.backgroundSize = "100% 100%";
  bgLayer.style.backgroundPosition = "center";
  bgLayer.style.backgroundRepeat = "no-repeat";

  root.appendChild(bgLayer);
  root.appendChild(entitiesLayer);
  root.appendChild(uiLayer);

  addFighterStyles();
  updateScale();
  window.addEventListener("resize", updateScale);

  input = new Input();

  const charId = config?.character?.id || "1";
  const charType = CHARACTER_TYPES[charId] || CHARACTER_TYPES[1];

  if (charType.useSprite) {
    const playerScale = charType.customScale || 2.5;
    player = new SpritePlayer({
      name: config?.character?.name || charType.name || "Player",
      x: 150,
      y: 300,
      strength: parseInt(config?.character?.strength) || 75,
      speed: parseInt(config?.character?.speed) || 80,
      defense: parseInt(config?.character?.defense) || 65,
      facing: 1,
      scale: playerScale,
      spriteConfig: charType.spriteConfig,
    });
  } else {
    player = new Player({
      name: config?.character?.name || charType.name || "Player",
      x: 150,
      y: 400,
      characterType: charType.type,
      strength: parseInt(config?.character?.strength) || 70,
      speed: parseInt(config?.character?.speed) || 70,
      defense: parseInt(config?.character?.defense) || 70,
      facing: 1,
    });
  }

  if (fightConfig.useSprite) {
    enemy = new SpriteEnemy({
      name: fightConfig.name,
      x: 650,
      y: 300,
      strength: fightConfig.strength,
      speed: fightConfig.speed,
      defense: fightConfig.defense,
      facing: -1,
      difficulty: fightConfig.difficulty,
      scale: 2.5,
    });
  } else {
    enemy = new Enemy({
      name: fightConfig.name,
      x: 680,
      y: 400,
      characterType: fightConfig.type,
      strength: fightConfig.strength,
      speed: fightConfig.speed,
      defense: fightConfig.defense,
      facing: -1,
      difficulty: fightConfig.difficulty,
      aggressiveness: fightConfig.aggressiveness,
    });
  }

  playerEl = document.createElement("div");
  playerEl.className = "fighter player";
  enemyEl = document.createElement("div");
  enemyEl.className = "fighter enemy";

  entitiesLayer.appendChild(playerEl);
  entitiesLayer.appendChild(enemyEl);

  player.attach(playerEl);
  enemy.attach(enemyEl);

  createHealthBars(fightConfig.name);
  createFightHUD(fightNum, fightConfig.name);
  createDefenseHUD();
  createPauseOverlay();

  engine = new Engine(update, render);

  window.addEventListener("keydown", handleKeyDown);

  showFightIntro(fightNum, fightConfig.name, () => {
    gameState = "playing";
    engine.start();
  });
}

function handleKeyDown(e) {
  if (e.key === "Escape") {
    togglePause();
  }
}

let pauseOverlay = null;

function createPauseOverlay() {
  pauseOverlay = document.createElement("div");
  Object.assign(pauseOverlay.style, {
    position: "absolute",
    inset: "0",
    background: "rgba(0,0,0,0.8)",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "100",
  });

  const panel = document.createElement("div");
  Object.assign(panel.style, {
    background: "linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%)",
    color: "#fff",
    padding: "30px 50px",
    borderRadius: "15px",
    textAlign: "center",
    border: "3px solid #ff9900",
    boxShadow: "0 0 30px rgba(255,153,0,0.5)",
  });

  const title = document.createElement("div");
  title.textContent = "PAUSED";
  Object.assign(title.style, {
    fontSize: "2rem",
    color: "#ff9900",
    marginBottom: "20px",
    letterSpacing: "3px",
  });

  const buttonStyle = {
    padding: "12px 30px",
    margin: "10px",
    fontSize: "1rem",
    fontWeight: "bold",
    border: "2px solid #ff9900",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s",
    fontFamily: "'Arial Black', sans-serif",
  };

  const btnContinue = document.createElement("button");
  btnContinue.textContent = "▶ CONTINUE";
  Object.assign(btnContinue.style, buttonStyle);
  btnContinue.style.background =
    "linear-gradient(135deg, #ff9900 0%, #ff6600 100%)";
  btnContinue.style.color = "#000";
  btnContinue.addEventListener("click", resumeGame);

  const btnStory = document.createElement("button");
  btnStory.textContent = "📖 BACK TO STORY";
  Object.assign(btnStory.style, buttonStyle);
  btnStory.style.background = "transparent";
  btnStory.style.color = "#ff9900";
  btnStory.addEventListener("click", returnToStory);

  const btnMenu = document.createElement("button");
  btnMenu.textContent = "🏠 MAIN MENU";
  Object.assign(btnMenu.style, buttonStyle);
  btnMenu.style.background = "transparent";
  btnMenu.style.color = "#ff9900";
  btnMenu.addEventListener("click", () => {
    window.location.href = "home.html";
  });

  panel.appendChild(title);
  panel.appendChild(document.createElement("br"));
  panel.appendChild(btnContinue);
  panel.appendChild(btnStory);
  panel.appendChild(btnMenu);
  pauseOverlay.appendChild(panel);
  uiLayer.appendChild(pauseOverlay);
}

function togglePause() {
  if (gameState === "paused") {
    resumeGame();
  } else if (gameState === "playing") {
    pauseGame();
  }
}

function pauseGame() {
  if (gameState !== "playing") return;
  gameState = "paused";
  if (pauseOverlay) pauseOverlay.style.display = "flex";
  engine.pause();
}

function resumeGame() {
  if (gameState !== "paused") return;
  gameState = "playing";
  if (pauseOverlay) pauseOverlay.style.display = "none";
  engine.resume();
}

function returnToStory() {
  gameState = "idle";
  if (engine) engine.pause();
  window.removeEventListener("keydown", handleKeyDown);

  document.getElementById("fight-container").classList.remove("active");
  document.getElementById("story-container").style.display = "flex";

  goToScene(currentScene);
}

function createHealthBars(enemyName) {
  const playerContainer = document.createElement("div");
  Object.assign(playerContainer.style, {
    position: "absolute",
    top: "20px",
    left: "20px",
    width: "300px",
  });

  const playerLabel = document.createElement("div");
  playerLabel.textContent = loadGameConfig()?.character?.name || "PLAYER";
  playerLabel.style.cssText =
    "color: #fff; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold; text-shadow: 1px 1px 2px black;";

  const playerBarBg = document.createElement("div");
  playerBarBg.style.cssText =
    "width: 100%; height: 25px; background: rgba(0,0,0,0.5); border: 2px solid #fff; border-radius: 5px; overflow: hidden;";

  playerHealthBar = document.createElement("div");
  playerHealthBar.style.cssText =
    "width: 100%; height: 100%; background: linear-gradient(90deg, #00ff00, #88ff00); transition: width 0.3s;";

  playerBarBg.appendChild(playerHealthBar);
  playerContainer.appendChild(playerLabel);
  playerContainer.appendChild(playerBarBg);
  uiLayer.appendChild(playerContainer);

  const enemyContainer = document.createElement("div");
  Object.assign(enemyContainer.style, {
    position: "absolute",
    top: "20px",
    right: "20px",
    width: "300px",
    textAlign: "right",
  });

  const enemyLabel = document.createElement("div");
  enemyLabel.id = "enemy-name-label";
  enemyLabel.textContent = enemyName.toUpperCase();
  enemyLabel.style.cssText =
    "color: #fff; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold; text-shadow: 1px 1px 2px black;";

  const enemyBarBg = document.createElement("div");
  enemyBarBg.style.cssText =
    "width: 100%; height: 25px; background: rgba(0,0,0,0.5); border: 2px solid #fff; border-radius: 5px; overflow: hidden;";

  enemyHealthBar = document.createElement("div");
  enemyHealthBar.style.cssText =
    "width: 100%; height: 100%; background: linear-gradient(90deg, #ff4400, #ff0000); transition: width 0.3s; margin-left: auto;";

  enemyBarBg.appendChild(enemyHealthBar);
  enemyContainer.appendChild(enemyLabel);
  enemyContainer.appendChild(enemyBarBg);
  uiLayer.appendChild(enemyContainer);
}

function createDefenseHUD() {
  playerDefenseHUD = new DefenseHUD(uiLayer, true);

  enemyDefenseHUD = new DefenseHUD(uiLayer, false);

  defenseScreenEffects = new DefenseScreenEffects(root);
}

function createFightHUD(fightNum, bossName) {
  const hud = document.createElement("div");
  hud.id = "fight-hud";
  Object.assign(hud.style, {
    position: "absolute",
    top: "10px",
    left: "50%",
    transform: "none",
    color: fightNum === 2 ? "#8B0000" : "#ff0000",
    fontSize: "1.2rem",
    fontFamily: "'Arial Black', sans-serif",
    textShadow:
      fightNum === 2
        ? "0 0 10px rgba(139,0,0,0.8)"
        : "0 0 10px rgba(255,0,0,0.8)",
    textAlign: "center",
  });
  hud.innerHTML = `
    <div>STAGE ${fightNum} — ${bossName.toUpperCase()}</div>
    <div style="font-size: 0.9rem; margin-top: 5px; color: #ff9900;">ROUND ${currentRound}/${maxRounds}</div>
    <div id="round-wins" style="font-size: 0.8rem; margin-top: 5px;">
      <span style="color: #00aaff;">●</span> ${playerWins} - ${enemyWins} <span style="color: #ff4400;">●</span>
    </div>
  `;
  uiLayer.appendChild(hud);
}

function showFightIntro(fightNum, enemyName, callback) {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    background: "rgba(0,0,0,0.95)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "9999",
  });

  const stageColor = fightNum === 2 ? "#8B0000" : "#ff0000";
  const vs = document.createElement("div");
  vs.innerHTML = `
    <div style="font-size: 1.2rem; color: #666; margin-bottom: 10px; letter-spacing: 5px;">STAGE ${fightNum}</div>
    <div style="font-size: 2rem; color: #00aaff; margin-bottom: 20px;">${
      loadGameConfig()?.character?.name || "PLAYER"
    }</div>
    <div style="font-size: 4rem; color: ${stageColor}; animation: pulse 0.5s infinite;" class="vs-text">VS</div>
    <div style="font-size: 2rem; color: ${stageColor}; margin-top: 20px;">${enemyName.toUpperCase()}</div>
  `;
  vs.style.textAlign = "center";
  vs.style.fontFamily = "'Arial Black', sans-serif";

  overlay.appendChild(vs);
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

function updateScale() {
  if (!root) return;
  const scaleX = root.offsetWidth / BASE_WIDTH;
  const scaleY = root.offsetHeight / BASE_HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  [bgLayer, entitiesLayer, uiLayer].forEach((l) => {
    if (l) l.style.transform = `scale(${scale})`;
  });
}

function update(dt) {
  if (gameState !== "playing") return;

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
      totalScore += damage * 10;
      showHitEffect(enemy);

      if (typeof damageResult === "object" && !damageResult.blocked) {
        player.defenseSystem.registerHit();
      }
    }

    // Handle defense feedback
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

    // Always register the hit to prevent multi-hit on same attack
    hitRegistered.enemy = true;

    if (damage > 0) {
      showHitEffect(player);

      // Register hit for block charge regeneration
      if (typeof damageResult === "object" && !damageResult.blocked) {
        enemy.defenseSystem.registerHit();
      }
    }

    // Handle defense feedback
    if (typeof damageResult === "object") {
      if (damageResult.blocked) {
        showBlockEffect(player, damageResult.perfectBlock);
        // perfect-block visual removed
      }
    }
  }

  updateHealthBars();

  updateDefenseHUD();

  if (player.health <= 0) {
    gameState = "ended";
    engine.pause();
    enemyWins++;
    handleRoundEnd(false);
  } else if (enemy.health <= 0) {
    gameState = "ended";
    engine.pause();
    playerWins++;
    totalScore += 500;
    handleRoundEnd(true);
  }
}

function handleRoundEnd(playerWon) {
  const winsNeeded = Math.ceil(maxRounds / 2);

  if (playerWins >= winsNeeded) {
    totalScore += 1000;
    showVictory();
  } else if (enemyWins >= winsNeeded) {
    showDefeat();
  } else {
    currentRound++;
    showRoundEnd(playerWon);
  }
}

function showRoundEnd(playerWon) {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "9999",
  });

  const resultColor = playerWon ? "#00ff00" : "#ff0000";
  const resultText = playerWon ? "YOU WIN" : "YOU LOSE";

  overlay.innerHTML = `
    <div style="font-size: 3rem; color: ${resultColor}; font-family: 'Arial Black', sans-serif; margin-bottom: 20px; text-shadow: 0 0 20px ${resultColor};">
      ${resultText}
    </div>
    <div style="font-size: 1.5rem; color: #fff; font-family: 'Arial Black', sans-serif; margin-bottom: 10px;">
      ROUND ${currentRound - 1}
    </div>
    <div style="font-size: 1.2rem; color: #ff9900; font-family: 'Arial', sans-serif;">
      Score: ${playerWins} - ${enemyWins}
    </div>
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
      startNextRound();
    }, 500);
  }, 2000);
}

function startNextRound() {
  player.reset(150);
  enemy.reset(680);

  updateRoundHUD();

  gameState = "playing";
  engine.resume();
}

function updateRoundHUD() {
  const roundWins = document.getElementById("round-wins");
  if (roundWins) {
    roundWins.innerHTML = `<span style="color: #00aaff;">●</span> ${playerWins} - ${enemyWins} <span style="color: #ff4400;">●</span>`;
  }
  const hud = document.getElementById("fight-hud");
  if (hud) {
    const roundDiv = hud.querySelector("div:nth-child(2)");
    if (roundDiv) {
      roundDiv.textContent = `ROUND ${currentRound}/${maxRounds}`;
    }
  }
}

function showHitEffect(fighter) {
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

function showBlockEffect(fighter, isPerfect) {
  if (fighter.el) {
    const effectClass = isPerfect ? "perfect-block-flash" : "block-flash";
    fighter.el.classList.add(effectClass);
    setTimeout(() => fighter.el.classList.remove(effectClass), 150);
  }
}

function updateHealthBars() {
  if (playerHealthBar) {
    const maxHP = player.maxHealth || 100;
    const playerHealthPercent = Math.max(0, (player.health / maxHP) * 100);
    playerHealthBar.style.width = playerHealthPercent + "%";

    // Change color based on health
    if (playerHealthPercent < 30) {
      playerHealthBar.style.background =
        "linear-gradient(90deg, #ff0000, #ff4400)";
    } else if (playerHealthPercent < 60) {
      playerHealthBar.style.background =
        "linear-gradient(90deg, #ffaa00, #ffff00)";
    } else {
      playerHealthBar.style.background =
        "linear-gradient(90deg, #00ff00, #88ff00)";
    }
  }
  if (enemyHealthBar) {
    const maxHP = enemy.maxHealth || 100;
    const enemyHealthPercent = Math.max(0, (enemy.health / maxHP) * 100);
    enemyHealthBar.style.width = enemyHealthPercent + "%";
  }
}

function updateDefenseHUD() {
  // Update player defense HUD
  if (playerDefenseHUD && player.defenseSystem) {
    playerDefenseHUD.update(player.defenseSystem);
    updateFighterDefenseVisuals(player);
  }

  // Update enemy defense HUD
  if (enemyDefenseHUD && enemy.defenseSystem) {
    enemyDefenseHUD.update(enemy.defenseSystem);
    updateFighterDefenseVisuals(enemy);
  }
}

function updateFighterDefenseVisuals(fighter) {
  if (!fighter || !fighter.el || !fighter.defenseSystem) return;

  const ds = fighter.defenseSystem;

  fighter.el.classList.toggle("invincible", ds.isInvincible);

  if (ds.perfectBlockFlashTimer > 0) {
    fighter.el.classList.add("perfect-block-flash");
  } else {
    fighter.el.classList.remove("perfect-block-flash");
  }
}

function render() {
  player.render(false);
  enemy.render(false);
}

function showVictory() {
  const fightConfig = fights[currentFight];

  setTimeout(() => {
    if (fightConfig.victoryScene === "coming-soon") {
      showComingSoon();
    } else {
      document.getElementById("fight-container").classList.remove("active");
      document.getElementById("story-container").style.display = "flex";
      goToScene(fightConfig.victoryScene);
    }
  }, 1500);
}

function showComingSoon() {
  const overlay = document.createElement("div");
  overlay.className = "coming-soon-screen";

  overlay.innerHTML = `
    <h1 class="coming-soon-title">COMING SOON</h1>
    <p class="coming-soon-text">The story continues...</p>
    <p style="color: #444; font-size: 0.9rem; margin-bottom: 40px;">Stage 3 and the final chapter are under development.</p>
    <button class="continue-btn" onclick="window.location.href='home.html'" style="margin-top: 20px;">
      🏠 RETURN TO MENU
    </button>
  `;

  document.body.appendChild(overlay);
}

function showDefeat() {
  const fightConfig = fights[currentFight];

  const overlay = document.createElement("div");
  overlay.className = "result-screen";
  overlay.id = "defeat-overlay";

  overlay.innerHTML = `
    <div class="result-title failed">DEFEATED</div>
    <div class="result-subtitle">Your programming life has ended.</div>
    <div style="font-size: 1.2rem; color: #888; margin-bottom: 20px;">
      Final Score: ${playerWins} - ${enemyWins}
    </div>
    <div class="dialog-box enemy-dialog" style="max-width: 600px; margin-bottom: 40px;">
      <span class="dialog-speaker enemy-speaker">${fightConfig.name.toUpperCase()}</span>
      <p class="story-text" style="margin: 0; text-align: left; font-size: 1.1rem;">
        "${fightConfig.defeatMessage}"
      </p>
    </div>
    <button class="continue-btn danger" id="retry-fight-btn" style="margin-bottom: 15px;">
      ⚔️ RETRY FIGHT
    </button>
    <button class="continue-btn withdraw" id="back-to-menu-btn">
      🏠 MAIN MENU
    </button>
  `;

  document.body.appendChild(overlay);

  // Add event listeners
  document
    .getElementById("retry-fight-btn")
    .addEventListener("click", retryFight);
  document.getElementById("back-to-menu-btn").addEventListener("click", () => {
    window.location.href = "home.html";
  });
}

function retryFight() {
  const overlay = document.getElementById("defeat-overlay");
  if (overlay) overlay.remove();

  currentRound = 1;
  playerWins = 0;
  enemyWins = 0;

  const gameEl = document.getElementById("game");
  if (gameEl) gameEl.innerHTML = "";

  window.removeEventListener("keydown", handleKeyDown);

  initFight(currentFight);
}

window.goToScene = goToScene;
window.withdrawStory = withdrawStory;
window.retreatToMenu = retreatToMenu;
window.startFight = startFight;
window.startAuditFight = startAuditFight;
