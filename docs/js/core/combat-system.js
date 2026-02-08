export const DEFENSE_CONFIG = {
  BLOCK_CHARGES: {
    MAX_CHARGES: 3,
    HITS_TO_REGEN: 2,
  },

  BLOCKING: {
    CHIP_DAMAGE_PERCENT: 0.15,
    PUSHBACK_NORMAL: 3,
    PUSHBACK_HEAVY: 6,
  },

  ESCAPE: {
    BACKDASH: {
      DISTANCE: 150,
      DURATION: 0.3,
      INVINCIBILITY_START: 0,
      INVINCIBILITY_END: 0.15,
      RECOVERY_VULNERABLE: 0.12,
      COOLDOWN: 0.8,
    },
    ROLL: {
      DISTANCE: 200,
      DURATION: 0.5,
      INVINCIBILITY_START: 0.05,
      INVINCIBILITY_END: 0.35,
      RECOVERY_VULNERABLE: 0.15,
      COOLDOWN: 1.2,
      STAMINA_COST: 20,
    },
    SPOT_DODGE: {
      DURATION: 0.25,
      INVINCIBILITY_START: 0.02,
      INVINCIBILITY_END: 0.18,
      RECOVERY_VULNERABLE: 0.07,
      COOLDOWN: 0.6,
    },
  },

  ANTI_TURTLE: {
    CONTINUOUS_BLOCK_PENALTY: {
      THRESHOLD_SECONDS: 3,
      PUSHBACK_MULTIPLIER: 1.3,
    },
    THROW_BEATS_BLOCK: true,
    UNBLOCKABLE_SETUP_TIME: 1.5,
  },
};

export const DEFENSE_STATE = {
  NEUTRAL: "neutral",
  STANDING_BLOCK: "standing_block",
  BACKDASH: "backdash",
  ROLL: "roll",
  SPOT_DODGE: "spot_dodge",
  ESCAPE_RECOVERY: "escape_recovery",
};

export class DefenseSystem {
  constructor(fighter) {
    this.fighter = fighter;

    this.state = DEFENSE_STATE.NEUTRAL;
    this.stateTimer = 0;

    this.blockCharges = DEFENSE_CONFIG.BLOCK_CHARGES.MAX_CHARGES;
    this.hitCounter = 0;
    this.backdashCooldown = 0;
    this.rollCooldown = 0;
    this.spotDodgeCooldown = 0;
    this.escapeTimer = 0;
    this.isInvincible = false;

    this.continuousBlockTime = 0;
    this.lastBlockDirection = null;

    this.stats = {
      blocksTotal: 0,
      escapesUsed: 0,
    };

    this.visualEffects = [];
  }

  update(dt, input) {
    this.updateTimers(dt);
    this.updateState(dt);
    this.updateVisualEffects(dt);
    this.processInput(input);
  }

  updateTimers(dt) {
    if (this.backdashCooldown > 0) this.backdashCooldown -= dt;
    if (this.rollCooldown > 0) this.rollCooldown -= dt;
    if (this.spotDodgeCooldown > 0) this.spotDodgeCooldown -= dt;
    if (this.escapeTimer > 0) this.escapeTimer -= dt;
  }

  updateState(dt) {
    this.stateTimer += dt;

    switch (this.state) {
      case DEFENSE_STATE.BACKDASH:
      case DEFENSE_STATE.ROLL:
      case DEFENSE_STATE.SPOT_DODGE:
        this.updateEscapeState(dt);
        break;
    }
  }

  updateEscapeState(dt) {
    const config = this.getEscapeConfig();
    if (!config) return;

    const elapsed = this.stateTimer;
    this.isInvincible =
      elapsed >= config.INVINCIBILITY_START &&
      elapsed <= config.INVINCIBILITY_END;

    if (elapsed >= config.DURATION) {
      this.isInvincible = false;
      this.setState(DEFENSE_STATE.NEUTRAL);
    }
  }

  getEscapeConfig() {
    switch (this.state) {
      case DEFENSE_STATE.BACKDASH:
        return DEFENSE_CONFIG.ESCAPE.BACKDASH;
      case DEFENSE_STATE.ROLL:
        return DEFENSE_CONFIG.ESCAPE.ROLL;
      case DEFENSE_STATE.SPOT_DODGE:
        return DEFENSE_CONFIG.ESCAPE.SPOT_DODGE;
      default:
        return null;
    }
  }

  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateTimer = 0;
    }
  }

  processInput(input) {
    if (!input) return;

    if (this.isInEscapeState()) return;

    if (input.justPressed) {
      if (input.justPressed("backdash") && this.canBackdash()) {
        this.executeBackdash();
      } else if (input.justPressed("roll") && this.canRoll()) {
        this.executeRoll();
      } else if (input.justPressed("dodge") && this.canSpotDodge()) {
        this.executeSpotDodge();
      }
    }
  }

  attemptBlock(attack) {
    const result = {
      blocked: false,
      damage: attack.damage,
      chipDamage: 0,
      pushback: 0,
      frameAdvantage: 0,
      feedback: null,
      blockBroken: false,
    };

    if (this.blockCharges <= 0) {
      result.feedback = { type: "no_blocks", message: "NO BLOCKS!" };
      return result;
    }

    result.blocked = true;
    result.damage = 0;
    result.chipDamage = 0;
    result.frameAdvantage = this.getFrameAdvantage();
    result.feedback = { type: "block", message: "BLOCKED" };
    this.blockCharges--;

    result.pushback = DEFENSE_CONFIG.BLOCKING.PUSHBACK_NORMAL;

    if (
      this.continuousBlockTime >
      DEFENSE_CONFIG.ANTI_TURTLE.CONTINUOUS_BLOCK_PENALTY.THRESHOLD_SECONDS
    ) {
      result.pushback *=
        DEFENSE_CONFIG.ANTI_TURTLE.CONTINUOUS_BLOCK_PENALTY.PUSHBACK_MULTIPLIER;
    }

    this.setState(DEFENSE_STATE.STANDING_BLOCK);

    this.stats.blocksTotal++;

    return result;
  }

  getFrameAdvantage() {
    return -4;
  }

  canBackdash() {
    return this.backdashCooldown <= 0 && this.state === DEFENSE_STATE.NEUTRAL;
  }

  canRoll() {
    return (
      this.rollCooldown <= 0 &&
      this.state === DEFENSE_STATE.NEUTRAL &&
      (this.fighter.stamina === undefined ||
        this.fighter.stamina >= DEFENSE_CONFIG.ESCAPE.ROLL.STAMINA_COST)
    );
  }

  canSpotDodge() {
    return this.spotDodgeCooldown <= 0 && this.state === DEFENSE_STATE.NEUTRAL;
  }

  executeBackdash() {
    if (!this.canBackdash()) return false;

    const config = DEFENSE_CONFIG.ESCAPE.BACKDASH;
    this.setState(DEFENSE_STATE.BACKDASH);
    this.backdashCooldown = config.COOLDOWN;
    this.isInvincible = true;
    this.stats.escapesUsed++;

    const direction = this.fighter.facing * -1; // Opposite facing direction
    this.fighter.velocity.x = (config.DISTANCE / config.DURATION) * direction;

    this.addVisualEffect({
      type: "backdash",
      duration: config.DURATION,
      trail: true,
    });

    return true;
  }

  executeRoll() {
    if (!this.canRoll()) return false;

    const config = DEFENSE_CONFIG.ESCAPE.ROLL;
    this.setState(DEFENSE_STATE.ROLL);
    this.rollCooldown = config.COOLDOWN;
    this.isInvincible = false; // Will become invincible after startup
    this.stats.escapesUsed++;

    // Consume stamina if applicable
    if (this.fighter.stamina !== undefined) {
      this.fighter.stamina -= config.STAMINA_COST;
    }

    const direction = this.fighter.facing;
    this.fighter.velocity.x = (config.DISTANCE / config.DURATION) * direction;

    this.addVisualEffect({
      type: "roll",
      duration: config.DURATION,
      blur: true,
    });

    return true;
  }

  executeSpotDodge() {
    if (!this.canSpotDodge()) return false;

    const config = DEFENSE_CONFIG.ESCAPE.SPOT_DODGE;
    this.setState(DEFENSE_STATE.SPOT_DODGE);
    this.spotDodgeCooldown = config.COOLDOWN;
    this.isInvincible = false;
    this.stats.escapesUsed++;

    this.addVisualEffect({
      type: "spot_dodge",
      duration: config.DURATION,
      fade: true,
    });

    return true;
  }

  isBlocking() {
    return this.state === DEFENSE_STATE.STANDING_BLOCK;
  }

  isInEscapeState() {
    return (
      this.state === DEFENSE_STATE.BACKDASH ||
      this.state === DEFENSE_STATE.ROLL ||
      this.state === DEFENSE_STATE.SPOT_DODGE ||
      this.state === DEFENSE_STATE.ESCAPE_RECOVERY
    );
  }

  canAct() {
    return this.state === DEFENSE_STATE.NEUTRAL;
  }

  isVulnerable() {
    if (this.isInEscapeState()) {
      const config = this.getEscapeConfig();
      if (config && this.stateTimer > config.INVINCIBILITY_END) {
        return true;
      }
    }
    return false;
  }

  addVisualEffect(effect) {
    effect.startTime = performance.now();
    effect.elapsed = 0;
    this.visualEffects.push(effect);
  }

  updateVisualEffects(dt) {
    this.visualEffects = this.visualEffects.filter((effect) => {
      effect.elapsed += dt;
      return effect.elapsed < effect.duration;
    });
  }

  getActiveEffects() {
    return this.visualEffects;
  }

  getDefenseStats() {
    return { ...this.stats };
  }

  reset() {
    this.state = DEFENSE_STATE.NEUTRAL;
    this.stateTimer = 0;
    this.blockCharges = DEFENSE_CONFIG.BLOCK_CHARGES.MAX_CHARGES;
    this.hitCounter = 0;
    this.blockInputTime = 0;

    this.backdashCooldown = 0;
    this.rollCooldown = 0;
    this.spotDodgeCooldown = 0;
    this.escapeTimer = 0;
    this.isInvincible = false;
    this.continuousBlockTime = 0;
    this.visualEffects = [];
  }

  registerHit() {
    this.hitCounter++;
    if (this.hitCounter >= DEFENSE_CONFIG.BLOCK_CHARGES.HITS_TO_REGEN) {
      this.hitCounter = 0;
      if (this.blockCharges < DEFENSE_CONFIG.BLOCK_CHARGES.MAX_CHARGES) {
        this.blockCharges++;
      }
    }
  }

  getBlockCharges() {
    return this.blockCharges;
  }

  getMaxBlockCharges() {
    return DEFENSE_CONFIG.BLOCK_CHARGES.MAX_CHARGES;
  }

  getHitsUntilRegen() {
    return DEFENSE_CONFIG.BLOCK_CHARGES.HITS_TO_REGEN - this.hitCounter;
  }
}

export function createAttack(options = {}) {
  return {
    damage: options.damage || 10,
    pushback: options.pushback || null,
    name: options.name || "Attack",
  };
}
