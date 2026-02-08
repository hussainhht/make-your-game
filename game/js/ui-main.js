import { DefenseHUD } from "./ui/defense-hud.js";
import { addFighterStyles } from "./ui/fighter-styles.js";



export let root = null;
export let bgLayer = null;
export let entitiesLayer = null;
export let uiLayer = null;

let overlayEl = null;
let btnContinue = null;
let btnRestart = null;
let roundTimerEl = null;
let roundEl = null;
let scoreEl = null;
let playerHealthBar = null;
let enemyHealthBar = null;
let playerWinsDisplay = null;
let enemyWinsDisplay = null;
let trainingDamageEl = null;
let trainingDamageHideTimer = null;

let playerDefenseHUD = null;
let enemyDefenseHUD = null;

let BASE_WIDTH = 960;
let BASE_HEIGHT = 540;

export function initUI(
  baseWidth,
  baseHeight,
  selectedMapPath,
  mountId = "game",
) {
  BASE_WIDTH = baseWidth;
  BASE_HEIGHT = baseHeight;

  const mount = document.getElementById(mountId);
  if (!mount) throw new Error(`#${mountId} element not found`);
  root = mount;




  Object.assign(root.style, {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#1a1a1a",
    userSelect: "none",
    touchAction: "none",
  });

  bgLayer = document.createElement("div");
  entitiesLayer = document.createElement("div");
  uiLayer = document.createElement("div");


  
  [bgLayer, entitiesLayer, uiLayer].forEach((l) => {
    Object.assign(l.style, {
      position: "absolute",
      inset: "0 0 0 0",
      width: BASE_WIDTH + "px",
      height: BASE_HEIGHT + "px",
      transformOrigin: "top left",
    });
  });

  Object.assign(bgLayer.style, {
    backgroundImage: `url('${selectedMapPath}')`,
    backgroundSize: "100% 100%",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  });

  root.appendChild(bgLayer);
  root.appendChild(entitiesLayer);
  root.appendChild(uiLayer);

  addFighterStyles();

  updateScale();
  window.addEventListener("resize", updateScale);
}

export function updateScale() {
  if (!root) return;
  const containerWidth = root.offsetWidth;
  const containerHeight = root.offsetHeight;
  const scaleX = containerWidth / BASE_WIDTH;
  const scaleY = containerHeight / BASE_HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  [bgLayer, entitiesLayer, uiLayer].forEach((layer) => {
    if (layer) layer.style.transform = `scale(${scale})`;
  });
}

export function createHUD() {
  const hudEl = document.createElement("div");
  Object.assign(hudEl.style, {
    position: "absolute",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontFamily: "'Arial Black', sans-serif",
    textAlign: "center",
    zIndex: "5",
  });

  roundTimerEl = document.createElement("div");
  roundTimerEl.style.fontSize = "2rem";
  roundTimerEl.style.color = "#ffffff";
  roundTimerEl.style.textShadow = "0 0 12px rgba(0,0,0,0.8)";
  roundTimerEl.style.letterSpacing = "2px";

  roundEl = document.createElement("div");
  roundEl.style.fontSize = "1.5rem";
  roundEl.style.color = "#ff9900";
  roundEl.style.textShadow = "0 0 10px rgba(255,153,0,0.8)";

  scoreEl = document.createElement("div");
  scoreEl.style.fontSize = "1rem";
  scoreEl.style.marginTop = "5px";

  hudEl.appendChild(roundTimerEl);
  hudEl.appendChild(roundEl);
  hudEl.appendChild(scoreEl);
  uiLayer.appendChild(hudEl);

  playerWinsDisplay = document.createElement("div");
  Object.assign(playerWinsDisplay.style, {
    position: "absolute",
    top: "60px",
    left: "20px",
    color: "#00ff00",
    fontSize: "1.2rem",
    fontFamily: "'Arial Black', sans-serif",
  });
  uiLayer.appendChild(playerWinsDisplay);

  enemyWinsDisplay = document.createElement("div");
  Object.assign(enemyWinsDisplay.style, {
    position: "absolute",
    top: "60px",
    right: "20px",
    color: "#ff4400",
    fontSize: "1.2rem",
    fontFamily: "'Arial Black', sans-serif",
  });
  uiLayer.appendChild(enemyWinsDisplay);
}

export function updateHUD({
  currentRound,
  score,
  playerWins,
  enemyWins,
  roundTimeRemaining,
}) {
  if (roundEl) roundEl.textContent = `ROUND ${currentRound}`;
  if (scoreEl) scoreEl.textContent = `Score: ${Math.floor(score)}`;
  if (playerWinsDisplay)
    playerWinsDisplay.textContent = "🏆".repeat(playerWins);
  if (enemyWinsDisplay) enemyWinsDisplay.textContent = "🏆".repeat(enemyWins);
  if (roundTimerEl)
    roundTimerEl.textContent = formatTimeSeconds(roundTimeRemaining);
}

export function createPauseOverlay(onContinue, onRestart, onMenu) {
  overlayEl = document.createElement("div");
  Object.assign(overlayEl.style, {
    position: "absolute",
    inset: "0",
    background: "rgba(0,0,0,0.7)",
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
  title.id = "pause-title";
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

  btnContinue = document.createElement("button");
  btnContinue.textContent = "▶ CONTINUE";
  Object.assign(btnContinue.style, buttonStyle);
  btnContinue.style.background =
    "linear-gradient(135deg, #ff9900 0%, #ff6600 100%)";
  btnContinue.style.color = "#000";
  btnContinue.addEventListener("click", () => onContinue && onContinue());

  btnRestart = document.createElement("button");
  btnRestart.textContent = "↺ RESTART";
  Object.assign(btnRestart.style, buttonStyle);
  btnRestart.style.background = "transparent";
  btnRestart.style.color = "#ff9900";
  btnRestart.addEventListener("click", () => onRestart && onRestart());

  const btnMenu = document.createElement("button");
  btnMenu.textContent = "🏠 MENU";
  Object.assign(btnMenu.style, buttonStyle);
  btnMenu.style.background = "transparent";
  btnMenu.style.color = "#ff9900";
  btnMenu.addEventListener("click", () => onMenu && onMenu());

  panel.appendChild(title);
  panel.appendChild(document.createElement("br"));
  panel.appendChild(btnContinue);
  panel.appendChild(btnRestart);
  panel.appendChild(btnMenu);
  overlayEl.appendChild(panel);
  uiLayer.appendChild(overlayEl);
}

export function showPauseOverlay() {
  if (overlayEl) overlayEl.style.display = "flex";
}
export function hidePauseOverlay() {
  if (overlayEl) overlayEl.style.display = "none";
}

export function createTrainingDamageUI() {
  if (trainingDamageEl) return;
  trainingDamageEl = document.createElement("div");
  trainingDamageEl.id = "training-damage";
  Object.assign(trainingDamageEl.style, {
    position: "absolute",
    top: "140px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#ff9900",
    fontSize: "2.2rem",
    fontFamily: "'Arial Black', sans-serif",
    textShadow: "0 0 14px rgba(255,153,0,0.8)",
    opacity: "0",
    transition: "opacity 0.15s ease",
    zIndex: "10",
    pointerEvents: "none",
    userSelect: "none",
  });
  trainingDamageEl.textContent = "";
  uiLayer.appendChild(trainingDamageEl);
}

export function showTrainingDps(damage) {
  if (!trainingDamageEl) return;
  const nowS = performance.now() / 1000;
  const dmg = Number.isFinite(damage) ? Math.max(0, Math.floor(damage)) : 0;
  if (!showTrainingDps._events) showTrainingDps._events = [];
  showTrainingDps._events.push({ t: nowS, damage: dmg });
  const cutoff = nowS - 1.0;
  while (
    showTrainingDps._events.length &&
    showTrainingDps._events[0].t < cutoff
  ) {
    showTrainingDps._events.shift();
  }
  const total = showTrainingDps._events.reduce((s, e) => s + e.damage, 0);
  const dps = Math.round(total / 1.0);
  trainingDamageEl.textContent = `DPS: ${dps}`;
  trainingDamageEl.style.opacity = "1";
  if (trainingDamageHideTimer) clearTimeout(trainingDamageHideTimer);
  trainingDamageHideTimer = setTimeout(() => {
    if (trainingDamageEl) trainingDamageEl.style.opacity = "0";
  }, 900);
}

export function showHitEffect(fighter) {
  if (fighter.el) {
    const body = fighter.el.querySelector(".fighter-body");
    if (body) {
      body.classList.add("hit-flash");
      setTimeout(() => body.classList.remove("hit-flash"), 300);
    }
  }
}

export function showBlockEffect(fighter, isPerfect) {
  if (fighter.el) {
    const effectClass = isPerfect ? "perfect-block-flash" : "block-flash";
    fighter.el.classList.add(effectClass);
    setTimeout(() => fighter.el.classList.remove(effectClass), 150);
  }
}

export function createHealthBars(playerName) {
  const playerHealthContainer = document.createElement("div");
  Object.assign(playerHealthContainer.style, {
    position: "absolute",
    top: "20px",
    left: "20px",
    width: "300px",
    height: "30px",
    background: "rgba(0, 0, 0, 0.5)",
    border: "2px solid #fff",
    borderRadius: "4px",
    overflow: "hidden",
  });
  playerHealthBar = document.createElement("div");
  Object.assign(playerHealthBar.style, {
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, #00ff00, #88ff00)",
    transition: "width 0.3s ease",
  });
  playerHealthContainer.appendChild(playerHealthBar);
  uiLayer.appendChild(playerHealthContainer);

  const playerLabel = document.createElement("div");
  playerLabel.textContent = (playerName || "PLAYER").toUpperCase();
  Object.assign(playerLabel.style, {
    position: "absolute",
    top: "2px",
    left: "22px",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "bold",
    textShadow: "1px 1px 2px black",
  });
  uiLayer.appendChild(playerLabel);

  const enemyHealthContainer = document.createElement("div");
  Object.assign(enemyHealthContainer.style, {
    position: "absolute",
    top: "20px",
    right: "20px",
    width: "300px",
    height: "30px",
    background: "rgba(0, 0, 0, 0.5)",
    border: "2px solid #fff",
    borderRadius: "4px",
    overflow: "hidden",
  });
  enemyHealthBar = document.createElement("div");
  Object.assign(enemyHealthBar.style, {
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, #ff4400, #ff0000)",
    transition: "width 0.3s ease",
    marginLeft: "auto",
  });
  enemyHealthContainer.appendChild(enemyHealthBar);
  uiLayer.appendChild(enemyHealthContainer);

  const enemyLabel = document.createElement("div");
  enemyLabel.textContent = "ENEMY";
  Object.assign(enemyLabel.style, {
    position: "absolute",
    top: "2px",
    right: "22px",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "bold",
    textShadow: "1px 1px 2px black",
  });
  uiLayer.appendChild(enemyLabel);
}

export function updateHealthBars(player, enemy) {
  if (playerHealthBar) {
    const playerHealthPercent = Math.max(0, (player.health / 100) * 100);
    playerHealthBar.style.width = playerHealthPercent + "%";
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
    const enemyHealthPercent = Math.max(0, (enemy.health / 100) * 100);
    enemyHealthBar.style.width = enemyHealthPercent + "%";
  }
}

export function createDefenseHUD() {
  playerDefenseHUD = new DefenseHUD(uiLayer, true);
  enemyDefenseHUD = new DefenseHUD(uiLayer, false);
}

export function updateDefenseHUD(player, enemy) {
  if (playerDefenseHUD && player.defenseSystem) {
    playerDefenseHUD.update(player.defenseSystem);
    updateFighterDefenseVisuals(player, player.defenseSystem);
  }
  if (enemyDefenseHUD && enemy.defenseSystem) {
    enemyDefenseHUD.update(enemy.defenseSystem);
    updateFighterDefenseVisuals(enemy, enemy.defenseSystem);
  }
}

function updateFighterDefenseVisuals(fighter, ds) {
  if (!fighter || !fighter.el || !ds) return;
  fighter.el.classList.toggle("invincible", ds.isInvincible);
  if (ds.perfectBlockFlashTimer > 0)
    fighter.el.classList.add("perfect-block-flash");
  else fighter.el.classList.remove("perfect-block-flash");
}

export function showRoundStart(round, callback) {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "9999",
  });

  const roundText = document.createElement("div");
  roundText.textContent = `ROUND ${round}`;
  Object.assign(roundText.style, {
    fontSize: "5rem",
    color: "#ff9900",
    fontFamily: "'Arial Black', sans-serif",
    textShadow: "0 0 30px rgba(255,153,0,0.8)",
  });

  const fightText = document.createElement("div");
  fightText.textContent = "FIGHT!";
  Object.assign(fightText.style, {
    fontSize: "3rem",
    color: "#fff",
    fontFamily: "'Arial Black', sans-serif",
    marginTop: "20px",
    opacity: "0",
  });

  overlay.appendChild(roundText);
  overlay.appendChild(fightText);
  uiLayer.appendChild(overlay);

  setTimeout(() => {
    overlay.style.transition = "opacity 0.3s";
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.remove();
      callback();
    }, 300);
  }, 1500);
}

export function showGameOverScreen(
  playerWon,
  restartCallback,
  homeCallback,
  finalScore,
) {
  const gameOverOverlay = document.createElement("div");
  Object.assign(gameOverOverlay.style, {
    position: "absolute",
    inset: "0",
    background: "rgba(0, 0, 0, 0.95)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "9999",
    color: "#fff",
    fontFamily: "'Arial Black', 'Impact', sans-serif",
  });

  const resultTitle = document.createElement("div");
  resultTitle.textContent = playerWon ? "VICTORY!" : "DEFEAT!";
  Object.assign(resultTitle.style, {
    fontSize: "5rem",
    color: playerWon ? "#00ff00" : "#ff0000",
    textShadow: playerWon
      ? "0 0 30px rgba(0, 255, 0, 0.8), 0 0 60px rgba(0, 255, 0, 0.5)"
      : "0 0 30px rgba(255, 0, 0, 0.8), 0 0 60px rgba(255, 0, 0, 0.5)",
    marginBottom: "30px",
    letterSpacing: "8px",
  });

  const subtitle = document.createElement("div");
  subtitle.textContent = playerWon ? "YOU WIN!" : "GAME OVER";
  Object.assign(subtitle.style, {
    fontSize: "2rem",
    color: "#ff9900",
    textShadow: "0 0 15px rgba(255, 153, 0, 0.8)",
    marginBottom: "40px",
    letterSpacing: "4px",
  });

  const statsPanel = document.createElement("div");
  Object.assign(statsPanel.style, {
    background: "rgba(0, 0, 0, 0.7)",
    padding: "20px 40px",
    borderRadius: "10px",
    border: "2px solid #ff9900",
    marginBottom: "40px",
    boxShadow: "0 0 20px rgba(255, 153, 0, 0.4)",
  });

  const finalScoreEl = document.createElement("div");
  finalScoreEl.textContent = `FINAL SCORE: ${Math.floor(finalScore || 0)}`;
  Object.assign(finalScoreEl.style, {
    fontSize: "1.5rem",
    color: "#fff",
    marginBottom: "10px",
    textAlign: "center",
  });
  statsPanel.appendChild(finalScoreEl);

  const buttonsContainer = document.createElement("div");
  Object.assign(buttonsContainer.style, { display: "flex", gap: "20px" });

  const restartBtn = document.createElement("button");
  restartBtn.textContent = "⟳ RESTART";
  Object.assign(restartBtn.style, {
    padding: "15px 40px",
    fontSize: "1.2rem",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #ff9900 0%, #ff6600 100%)",
    color: "#000",
    border: "3px solid #ffcc00",
    borderRadius: "8px",
    cursor: "pointer",
    letterSpacing: "2px",
    boxShadow: "0 5px 15px rgba(255, 153, 0, 0.5)",
    transition: "all 0.3s ease",
    fontFamily: "'Arial Black', sans-serif",
  });
  restartBtn.addEventListener("click", () => {
    gameOverOverlay.remove();
    restartCallback && restartCallback();
  });

  const homeBtn = document.createElement("button");
  homeBtn.textContent = "🏠 MAIN MENU";
  Object.assign(homeBtn.style, {
    padding: "15px 40px",
    fontSize: "1.2rem",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #555 0%, #333 100%)",
    color: "#fff",
    border: "3px solid #666",
    borderRadius: "8px",
    cursor: "pointer",
    letterSpacing: "2px",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
    transition: "all 0.3s ease",
    fontFamily: "'Arial Black', sans-serif",
  });
  homeBtn.addEventListener("click", () => {
    homeCallback && homeCallback();
  });

  buttonsContainer.appendChild(restartBtn);
  buttonsContainer.appendChild(homeBtn);

  gameOverOverlay.appendChild(resultTitle);
  gameOverOverlay.appendChild(subtitle);
  gameOverOverlay.appendChild(statsPanel);
  gameOverOverlay.appendChild(buttonsContainer);

  const style = document.createElement("style");
  style.textContent = `@keyframes fadeOnly { from { opacity: 0; } to { opacity: 1; } }`;
  document.head.appendChild(style);

  uiLayer.appendChild(gameOverOverlay);
}

function formatTimeSeconds(seconds) {
  const totalSec = Math.max(0, Math.ceil(seconds));
  const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${m}:${s}`;
}
