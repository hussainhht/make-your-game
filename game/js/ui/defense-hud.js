
import { DEFENSE_CONFIG, DEFENSE_STATE } from "../core/combat-system.js";


export class DefenseHUD {
  constructor(container, isPlayer = true) {
    this.container = container;
    this.isPlayer = isPlayer;
    this.elements = {};
    this.feedbackQueue = [];

    this.createElements();
    this.injectStyles();
  }

  createElements() {
    // Main defense HUD container
    this.elements.wrapper = document.createElement("div");
    this.elements.wrapper.className = `defense-hud ${
      this.isPlayer ? "player" : "enemy"
    }`;

    // Block Charges Display
    this.elements.blockChargesContainer = document.createElement("div");
    this.elements.blockChargesContainer.className = "block-charges-container";

    this.elements.blockChargesLabel = document.createElement("span");
    this.elements.blockChargesLabel.className = "block-charges-label";
    this.elements.blockChargesLabel.textContent = "BLOCKS";

    this.elements.blockChargesIcons = document.createElement("div");
    this.elements.blockChargesIcons.className = "block-charges-icons";

    this.elements.blockChargesContainer.appendChild(
      this.elements.blockChargesLabel,
    );
    this.elements.blockChargesContainer.appendChild(
      this.elements.blockChargesIcons,
    );

    // Defense State Indicator
    this.elements.stateIndicator = document.createElement("div");
    this.elements.stateIndicator.className = "defense-state-indicator";

    // Feedback popup container
    this.elements.feedbackContainer = document.createElement("div");
    this.elements.feedbackContainer.className = "defense-feedback-container";

    // Cooldown indicators
    this.elements.cooldownContainer = document.createElement("div");
    this.elements.cooldownContainer.className = "cooldown-container";

    this.elements.backdashCooldown = this.createCooldownIcon("backdash", "⬅️");
    this.elements.rollCooldown = this.createCooldownIcon("roll", "🔄");
    this.elements.dodgeCooldown = this.createCooldownIcon("dodge", "💨");

    this.elements.cooldownContainer.appendChild(this.elements.backdashCooldown);
    this.elements.cooldownContainer.appendChild(this.elements.rollCooldown);
    this.elements.cooldownContainer.appendChild(this.elements.dodgeCooldown);

    // Assemble
    this.elements.wrapper.appendChild(this.elements.blockChargesContainer);
    this.elements.wrapper.appendChild(this.elements.stateIndicator);
    this.elements.wrapper.appendChild(this.elements.cooldownContainer);
    this.elements.wrapper.appendChild(this.elements.feedbackContainer);

    this.container.appendChild(this.elements.wrapper);
  }

  createCooldownIcon(type, emoji) {
    const icon = document.createElement("div");
    icon.className = `cooldown-icon cooldown-${type}`;
    icon.innerHTML = `<span class="cooldown-emoji">${emoji}</span><div class="cooldown-overlay"></div>`;
    return icon;
  }

  injectStyles() {
    if (document.getElementById("defense-hud-styles")) return;

    const style = document.createElement("style");
    style.id = "defense-hud-styles";
    style.textContent = `
      .defense-hud {
        position: absolute;
        display: flex;
        flex-direction: column;
        gap: 5px;
        z-index: 10;
        pointer-events: none;
      }
      
      .defense-hud.player {
        left: 20px;
        top: 95px;
      }
      
      .defense-hud.enemy {
        right: 20px;
        top: 95px;
        align-items: flex-end;
      }
      
      /* Block Charges Display */
      .block-charges-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .defense-hud.enemy .block-charges-container {
        flex-direction: row-reverse;
      }
      
      .block-charges-label {
        font-size: 0.65rem;
        font-weight: bold;
        color: #88ccff;
        text-shadow: 0 0 5px rgba(136, 204, 255, 0.5);
        letter-spacing: 1px;
      }
      
      .block-charges-icons {
        display: flex;
        gap: 4px;
      }
      
      .block-charge {
        width: 16px;
        height: 16px;
        border-radius: 3px;
        border: 2px solid #44aaff;
        background: linear-gradient(180deg, #44aaff 0%, #2266cc 100%);
        box-shadow: 0 0 8px rgba(68, 170, 255, 0.6);
        transition: all 0.2s ease;
      }
      
      .block-charge.empty {
        background: linear-gradient(180deg, #333 0%, #1a1a1a 100%);
        border-color: #444;
        box-shadow: none;
        opacity: 0.5;
      }
      

      @keyframes charge-pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.8; border-color: #66ccff; }
      }
      
      /* Defense State Indicator */
      .defense-state-indicator {
        font-size: 0.7rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 2px 8px;
        border-radius: 3px;
        opacity: 0;
        transition: none;
      }
      
      .defense-state-indicator.active {
        opacity: 1;
      }
      
      .defense-state-indicator.blocking {
        background: rgba(68, 170, 255, 0.3);
        color: #88ccff;
        border: 1px solid #44aaff;
      }
      
      .defense-state-indicator.perfect-block {
        background: rgba(255, 215, 0, 0.4);
        color: #ffd700;
        border: 1px solid #ffd700;
        animation: perfect-glow 0.3s ease-out;
      }
      
      .defense-state-indicator.invincible {
        background: rgba(255, 255, 255, 0.3);
        color: #ffffff;
        border: 1px solid #ffffff;
      }
      
      @keyframes perfect-glow {
        0% { transform: scale(1.3); box-shadow: 0 0 20px #ffd700; }
        100% { transform: scale(1); box-shadow: none; }
      }
      
      /* Cooldown Indicators */
      .cooldown-container {
        display: flex;
        gap: 5px;
      }
      
      .cooldown-icon {
        width: 24px;
        height: 24px;
        position: relative;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid #444;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .cooldown-emoji {
        font-size: 0.8rem;
        z-index: 1;
      }
      
      .cooldown-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 3px;
        transition: height 0.1s linear;
      }
      
      .cooldown-icon.ready .cooldown-overlay {
        height: 0%;
      }
      
      .cooldown-icon.ready {
        border-color: #4a4;
        box-shadow: 0 0 5px rgba(68, 170, 68, 0.5);
      }
      
      /* Feedback Popups */
      .defense-feedback-container {
        position: relative;
        height: 30px;
      }
      
      .defense-feedback {
        position: absolute;
        font-size: 1rem;
        font-weight: bold;
        text-shadow: 0 0 10px currentColor, 2px 2px 0 #000;
        animation: feedback-popup 0.6s ease-out forwards;
        white-space: nowrap;
      }
      
      .defense-feedback.perfect {
        color: #ffd700;
      }
      
      .defense-feedback.block {
        color: #88ccff;
        font-size: 0.8rem;
      }
      
      @keyframes feedback-popup {
        0% { 
          opacity: 1; 
          transform: translateY(0) scale(1.2); 
        }
        70% {
          opacity: 1;
          transform: translateY(-15px) scale(1);
        }
        100% { 
          opacity: 0; 
          transform: translateY(-25px) scale(0.8); 
        }
      }
      
      /* Fighter visual effects */
      .fighter.perfect-block-flash {
        filter: brightness(2) saturate(1.5) !important;
      }
      
      .fighter.invincible {
        opacity: 0.6;
        filter: brightness(1.5) contrast(1.2) !important;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Update the defense HUD with current defense system state
   */
  update(defenseSystem) {
    if (!defenseSystem) return;

    this.updateBlockCharges(defenseSystem);
    this.updateStateIndicator(defenseSystem);
    this.updateCooldowns(defenseSystem);
    this.updateFeedback();
  }

  updateBlockCharges(ds) {
    const container = this.elements.blockChargesIcons;
    const currentCharges = ds.getBlockCharges();
    const maxCharges = ds.getMaxBlockCharges();
    const hitsUntilRegen = ds.getHitsUntilRegen();

    // Clear and rebuild charge icons
    container.innerHTML = "";

    for (let i = 0; i < maxCharges; i++) {
      const charge = document.createElement("div");
      charge.className = "block-charge";

      if (i >= currentCharges) {
        charge.classList.add("empty");
        // Show regeneration progress on the next empty slot
        if (i === currentCharges && hitsUntilRegen < 3) {
          charge.classList.add("regenerating");
        }
      }

      container.appendChild(charge);
    }
  }

  updateStateIndicator(ds) {
    const indicator = this.elements.stateIndicator;
    indicator.className = "defense-state-indicator";

    let showIndicator = true;
    let stateClass = "";
    let stateText = "";

    switch (ds.state) {
      case DEFENSE_STATE.STANDING_BLOCK:
        stateClass = "blocking";
        stateText = "BLOCKING";
        break;
      case DEFENSE_STATE.BACKDASH:
      case DEFENSE_STATE.ROLL:
      case DEFENSE_STATE.SPOT_DODGE:
        if (ds.isInvincible) {
          stateClass = "invincible";
          stateText = "INVINCIBLE";
        } else {
          showIndicator = false;
        }
        break;
      default:
        showIndicator = false;
    }

    if (showIndicator) {
      indicator.classList.add("active", stateClass);
      indicator.textContent = stateText;
    }
  }

  updateCooldowns(ds) {
    this.updateCooldownIcon(
      this.elements.backdashCooldown,
      ds.backdashCooldown,
      DEFENSE_CONFIG.ESCAPE.BACKDASH.COOLDOWN,
    );
    this.updateCooldownIcon(
      this.elements.rollCooldown,
      ds.rollCooldown,
      DEFENSE_CONFIG.ESCAPE.ROLL.COOLDOWN,
    );
    this.updateCooldownIcon(
      this.elements.dodgeCooldown,
      ds.spotDodgeCooldown,
      DEFENSE_CONFIG.ESCAPE.SPOT_DODGE.COOLDOWN,
    );
  }

  updateCooldownIcon(element, currentCooldown, maxCooldown) {
    const overlay = element.querySelector(".cooldown-overlay");
    const isReady = currentCooldown <= 0;

    element.classList.toggle("ready", isReady);

    if (!isReady) {
      const percent = (currentCooldown / maxCooldown) * 100;
      overlay.style.height = `${percent}%`;
    } else {
      overlay.style.height = "0%";
    }
  }

  /**
   * Show feedback popup for defense events
   */
  showFeedback(feedback) {
    if (!feedback) return;

    const popup = document.createElement("div");
    popup.className = `defense-feedback ${feedback.type.replace("_", "-")}`;
    popup.textContent = feedback.message;

    this.elements.feedbackContainer.appendChild(popup);

    // Remove after animation
    setTimeout(() => {
      popup.remove();
    }, 600);
  }

  updateFeedback() {
    // Process any queued feedback
    while (this.feedbackQueue.length > 0) {
      this.showFeedback(this.feedbackQueue.shift());
    }
  }

  queueFeedback(feedback) {
    this.feedbackQueue.push(feedback);
  }

  destroy() {
    if (this.elements.wrapper && this.elements.wrapper.parentNode) {
      this.elements.wrapper.parentNode.removeChild(this.elements.wrapper);
    }
  }
}

/**
 * Screen effects for major defense events
 */
export class DefenseScreenEffects {
  constructor(container) {
    this.container = container;
    this.createOverlay();
  }

  createOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.className = "defense-screen-overlay";
    this.overlay.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 100;
    `;
    this.container.appendChild(this.overlay);

    // Add styles if not present
    if (!document.getElementById("defense-screen-effects-styles")) {
      const style = document.createElement("style");
      style.id = "defense-screen-effects-styles";
      style.textContent = `
        .defense-screen-overlay.perfect-flash {
          animation: screen-perfect-flash 0.15s ease-out;
        }
        
        @keyframes screen-perfect-flash {
          0% { background: rgba(255, 215, 0, 0.4); }
          100% { background: transparent; }
        }
        
        .screen-shake {
          animation: screen-shake 0.2s ease-out;
        }
        
        @keyframes screen-shake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-5px, 2px); }
          40% { transform: translate(5px, -2px); }
          60% { transform: translate(-3px, 1px); }
          80% { transform: translate(3px, -1px); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  triggerEffect(type) {
    this.overlay.className = "defense-screen-overlay";
    // Force reflow
    void this.overlay.offsetWidth;

    // perfect-block screen effect removed
    switch (type) {
      default:
        break;
    }
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
