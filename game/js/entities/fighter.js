// todo finsh js/entities/fighter.js

import { applyGravity } from "../core/physics.js";
import {
  DefenseSystem,
  DEFENSE_STATE,
  DEFENSE_CONFIG,
  createAttack,
} from "../core/combat-system.js";

// Fighter states
export const FIGHTER_STATES = {
  IDLE: "idle",
  RUNNING: "running",
  JUMPING: "jumping",
  ATTACKING: "attacking",
  HURT: "hurt",
  BLOCKING: "blocking",
  PERFECT_BLOCK: "perfect_block",
  BACKDASH: "backdash",
  ROLL: "roll",
  DODGE: "dodge",
  DEAD: "dead",
};

// Fighter entity
export class Fighter {
  //! Initialize fighter with config
  constructor(config) {
    // Basic properties
    this.name = config.name;
    this.position = { x: config.x ?? 0, y: config.y ?? 300 }; // Start above ground
    this.velocity = { x: 0, y: 10 }; // Start with slight downward velocity
    this.width = 128;
    this.height = 200;
    this.color = config.color || "red"; // For debug rendering
    this.health = 100;
    this.maxHealth = 100;
    this.jump_strength = -15;
    this.is_on_ground = true; // Is the fighter on the ground?

    // Direction: 1 = facing right, -1 = facing left
    this.facing = config.facing || 1;

    // Fighter stats (affects gameplay) // Default values
    this.strength = config.strength || 70;
    this.speed = config.speed || 70;
    this.defense = config.defense || 70;

    // Character type for different sprites
    this.characterType = config.characterType || "warrior";

    // State machine / movement flags
    this.state = FIGHTER_STATES.IDLE;
    this.stateTimer = 0;
    this.isMoving = false;

    // Combat
    this.isAttacking = false;
    this.isBlocking = false; // Is currently blocking
    this.isHurt = false;
    this.attackCooldown = 0.01;
    this.hurtCooldown = 0;
    this.blockHeld = false; // Is block button held down

    // =========================================================================
    // DEFENSE SYSTEM INTEGRATION
    // =========================================================================
    this.defenseSystem = new DefenseSystem(this); // Pass fighter reference

    // Stamina for escape options
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaRegenRate = 15; // Per second
    this.staminaRegenDelay = 0.5;
    this.staminaRegenTimer = 0;

    // Animation
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameDuration = 0.12;
    this.animationFrames = {
      idle: 4,
      run: 4,
      attack: 4,
      hurt: 2,
      block: 1,
      backdash: 3,
      roll: 4,
      dodge: 2,
    };

    // Hitboxes
    this.hitbox = {
      x: 0,
      y: 0,
      width: this.width * 0.5,
      height: this.height,
    };

    this.attackBox = {
      x: 0,
      y: 0,
      width: 80,
      height: 60,
      active: false,
      damage: (10 * this.strength) / 100, // Base damage scaled by strength
    };

    this.el = null;
  }

  // Change fighter state
  setState(newState) {
    // Only change if different
    if (this.state !== newState) {
      this.state = newState;
      this.stateTimer = 0;
      this.currentFrame = 0;
      this.frameTime = 0;
    }
  }

  // Update fighter state and behavior
  update(dt, input, opponent) {
    // Update timers
    this.stateTimer += dt;

    // Update attack and hurt cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.hurtCooldown > 0) this.hurtCooldown -= dt;

    // Update defense system
    this.defenseSystem.update(dt, input);

    // Update stamina regeneration
    this.updateStamina(dt);

    // Apply gravity
    applyGravity(this, dt);
    this.position.y += this.velocity.y;

    // Ground collision - place at bottom of visible screen
    const groundY = 540 - this.height - 20; // Bottom of screen with small margin
    if (this.position.y >= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.is_on_ground = true;
    }

    // Screen bounds
    this.position.x = Math.max(0, Math.min(960 - this.width, this.position.x));
    this.position.y = Math.max(0, Math.min(540 - this.height, this.position.y));

    // Apply friction to horizontal velocity
    this.velocity.x *= 0.85;

    // Apply velocity from defense system (backdash, roll, etc.)
    this.position.x += this.velocity.x * dt * 60;

    // Update hitboxes
    this.updateHitbox();

    // Update animation
    this.updateAnimation(dt);

    // Sync defense system state to fighter state
    this.syncDefenseState();

    // Auto-return from hurt state
    if (this.isHurt && this.hurtCooldown <= 0) {
      // End of hurt cooldown
      this.isHurt = false;
      this.setState(FIGHTER_STATES.IDLE); // Return to idle
    }

    // Auto-return from attack state
    if (this.isAttacking && this.attackCooldown <= 0) {
      this.isAttacking = false;
      this.attackBox.active = false;
      this.setState(FIGHTER_STATES.IDLE);
    }

    // Auto face opponent (when not in special defense states)
    if (
      opponent &&
      !this.isAttacking &&
      !this.isHurt &&
      !this.defenseSystem.isInEscapeState()
    ) {
      this.facing = opponent.position.x > this.position.x ? 1 : -1;
    }

    // Update state based on movement (only when in neutral defense state)
    const canUpdateState =
      !this.isAttacking &&
      !this.isHurt && // Not hurt
      !this.isBlocking &&
      this.defenseSystem.state === DEFENSE_STATE.NEUTRAL;

    if (canUpdateState) {
      if (this.isMoving) {
        this.setState(FIGHTER_STATES.RUNNING);
      } else if (!this.is_on_ground) {
        this.setState(FIGHTER_STATES.JUMPING);
      } else {
        this.setState(FIGHTER_STATES.IDLE);
      }
    }
  }

  // Stamina regeneration
  updateStamina(dt) {
    if (this.stamina < this.maxStamina) {
      this.staminaRegenTimer += dt;
      if (this.staminaRegenTimer >= this.staminaRegenDelay) {
        this.stamina = Math.min(
          this.maxStamina,
          this.stamina + this.staminaRegenRate * dt,
        );
      }
    } else {
      this.staminaRegenTimer = 0;
    }
  }

  // Sync defense system state to fighter state
  syncDefenseState() {
    const ds = this.defenseSystem;

    // Only sync blocking state from defense system
    this.isBlocking = ds.isBlocking();

    // Only override fighter state for special defense states
    // Don't override during attacks or hurt
    if (this.isAttacking || this.isHurt) return;

    // Map special defense states to fighter states
    switch (ds.state) {
      // PERFECT_BLOCK removed
      case DEFENSE_STATE.BACKDASH:
        this.setState(FIGHTER_STATES.BACKDASH);
        break;
      case DEFENSE_STATE.ROLL:
        this.setState(FIGHTER_STATES.ROLL);
        break;
      case DEFENSE_STATE.SPOT_DODGE:
        this.setState(FIGHTER_STATES.DODGE);
        break;
      // Don't override for NEUTRAL and STANDING_BLOCK
      // Those are handled by the block() method and normal state updates
    }
  }

  // Update hitbox positions
  updateHitbox() {
    // Center hitbox on fighter
    this.hitbox.x = this.position.x + (this.width - this.hitbox.width) / 2;
    this.hitbox.y = this.position.y;

    // Position attack box in front of fighter
    if (this.attackBox.active) {
      if (this.facing === 1) {
        this.attackBox.x = this.position.x + this.width - 20;
      } else {
        this.attackBox.x = this.position.x - this.attackBox.width + 20;
      }
      this.attackBox.y =
        this.position.y + this.height / 2 - this.attackBox.height / 2;
    }
  }

  // Update animation frame based on state
  updateAnimation(dt) {
    const stateToAnim = {
      [FIGHTER_STATES.IDLE]: "idle",
      [FIGHTER_STATES.RUNNING]: "run",
      [FIGHTER_STATES.ATTACKING]: "attack",
      [FIGHTER_STATES.HURT]: "hurt",
      [FIGHTER_STATES.BLOCKING]: "block",
      [FIGHTER_STATES.PERFECT_BLOCK]: "block",
      [FIGHTER_STATES.BACKDASH]: "backdash",
      [FIGHTER_STATES.ROLL]: "roll",
      [FIGHTER_STATES.DODGE]: "dodge",
    };

    const animName = stateToAnim[this.state] || "idle"; // Fallback to idle
    const frameCount = this.animationFrames[animName] || 4; // Fallback to 4 frames

    // Advance frame based on frame duration
    this.frameTime += dt;
    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % frameCount;
    }
  }

  // Perform an attack
  attack() {
    // Can't attack if already attacking, on cooldown, hurt, or blocking
    if (
      this.isAttacking ||
      this.attackCooldown > 0 ||
      this.isHurt ||
      this.isBlocking ||
      this.defenseSystem.isInEscapeState()
    )
      return;

    this.isAttacking = true;
    this.attackCooldown = 0.5; // Half-second cooldown
    this.currentFrame = 0;
    this.setState(FIGHTER_STATES.ATTACKING);

    // Activate attack box
    setTimeout(() => {
      if (this.isAttacking) {
        this.attackBox.active = true;
        this.attackBox.damage = Math.floor(10 + this.strength / 10);

        setTimeout(() => {
          this.attackBox.active = false;
        }, 100);
      }
    }, 80);
  }

  // Block input
  block(active) {
    if (this.isAttacking || this.isHurt) return;

    this.blockHeld = active;

    if (active) {
      this.defenseSystem.setState(DEFENSE_STATE.STANDING_BLOCK);
      this.isBlocking = true;
      this.setState(FIGHTER_STATES.BLOCKING);
    } else {
      // Release block
      this.defenseSystem.setState(DEFENSE_STATE.NEUTRAL);
      this.isBlocking = false;
      if (this.state === FIGHTER_STATES.BLOCKING) {
        this.setState(FIGHTER_STATES.IDLE);
      }
    }
  }

  // Escape options
  backdash() {
    if (this.isAttacking || this.isHurt) return false;
    if (!this.consumeStamina(20)) return false;
    return this.defenseSystem.executeBackdash();
  }

  roll() {
    if (this.isAttacking || this.isHurt) return false;
    if (!this.consumeStamina(25)) return false;
    return this.defenseSystem.executeRoll();
  }

  spotDodge() {
    if (this.isAttacking || this.isHurt) return false;
    if (!this.consumeStamina(15)) return false;
    return this.defenseSystem.executeSpotDodge();
  }

  /**
   * Enhanced takeDamage with full defense system integration
   */
  takeDamage(amount, attacker, attackInfo = null) {
    // Ignore damage if in hurt cooldown or already dead
    if (this.hurtCooldown > 0 || this.health <= 0)
      return { damage: 0, blocked: false };

    // Create attack object if not provided
    const attack =
      attackInfo ||
      createAttack({
        damage: amount,
      });

    // Check for invincibility (from escapes)
    if (this.defenseSystem.isInvincible) {
      return { damage: 0, blocked: false, invincible: true };
    }

    // Check for block - use defense system state
    if (this.defenseSystem.isBlocking()) {
      const blockResult = this.defenseSystem.attemptBlock(attack);

      // Successful block
      if (blockResult.blocked) {
        // Apply chip damage
        if (blockResult.chipDamage > 0) {
          this.health = Math.max(1, this.health - blockResult.chipDamage);
        }

        // Apply pushback
        this.velocity.x = attacker.facing * blockResult.pushback;

        // Successful block
        return {
          damage: blockResult.chipDamage,
          blocked: true,
          perfectBlock: blockResult.perfectBlock,
          result: blockResult,
        };
      }
    }

    // Full damage - not blocked
    let actualDamage = amount;

    // Apply defense reduction
    actualDamage = Math.max(1, Math.floor(amount * (1 - this.defense / 200)));

    // Apply knockback
    this.velocity.x = attacker.facing * 6;

    // Enter hurt state
    this.isHurt = true;
    this.hurtCooldown = 0.3;
    this.isAttacking = false;
    this.attackBox.active = false;
    this.currentFrame = 0;
    this.setState(FIGHTER_STATES.HURT);

    this.health = Math.max(0, this.health - actualDamage);

    // Return damage info
    return {
      damage: actualDamage,
      blocked: false,
    };
  }

  consumeStamina(amount) {
    if (this.stamina >= amount) {
      this.stamina -= amount;
      this.staminaRegenTimer = 0; // Reset regen timer when consuming
      return true;
    }
    return false; // Not enough stamina
  }

  // Check if attack is hitting opponent
  isAttackHitting(opponent) {
    if (!this.attackBox.active) return false;

    // AABB collision check
    return (
      this.attackBox.x < opponent.hitbox.x + opponent.hitbox.width &&
      this.attackBox.x + this.attackBox.width > opponent.hitbox.x &&
      this.attackBox.y < opponent.hitbox.y + opponent.hitbox.height &&
      this.attackBox.y + this.attackBox.height > opponent.hitbox.y
    );
  }

  // Attach a DOM element to represent this fighter (for DOM/SVG rendering)
  attach(el) {
    this.el = el;
    if (!this.el) return;

    Object.assign(this.el.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: this.width + "px",
      height: this.height + "px",
      willChange: "transform",
      overflow: "visible",
      transform: `translate(${Math.round(this.position.x)}px, ${Math.round(this.position.y)}px) scaleX(${this.facing})`,
    });

    // Create the fighter visual
    this.el.innerHTML = `
      <div class="fighter-body ${this.characterType}" style="
        width: 100%;
        height: 100%;
        position: relative;
      ">
        <div class="fighter-sprite"></div>
      </div>
    `;

    this.render();
  }

  // DOM-based render
  render(debugHitboxes = false) {
    if (!this.el) return;

    // Position and flip
    const scaleX = this.facing;
    this.el.style.transform = `translate(${Math.round(
      this.position.x,
    )}px, ${Math.round(this.position.y)}px) scaleX(${scaleX})`;

    // Update animation class
    const body = this.el.querySelector(".fighter-body");
    if (body) {
      body.className = `fighter-body ${this.characterType} state-${this.state} frame-${this.currentFrame}`;

      // Add blocking visual feedback
      if (this.isBlocking) {
        body.classList.add("blocking");
      }
      if (this.isHurt) {
        body.classList.add("hurt");
      }
    }

    // Debug hitboxes
    if (debugHitboxes) {
      this.renderHitboxes();
    }
  }

  // Debug: visualize hitboxes
  renderHitboxes() {
    // Remove old hitbox visualizations
    const oldHitboxes = this.el.querySelectorAll(".hitbox-debug");
    oldHitboxes.forEach((el) => el.remove());

    // Render main hitbox (green outline)
    const hitboxEl = document.createElement("div");
    hitboxEl.className = "hitbox-debug";
    Object.assign(hitboxEl.style, {
      position: "absolute",
      left: this.hitbox.x - this.position.x + "px",
      top: "0",
      width: this.hitbox.width + "px",
      height: this.hitbox.height + "px",
      border: "2px solid lime",
      pointerEvents: "none",
      boxSizing: "border-box",
      opacity: "0.5",
    });
    this.el.appendChild(hitboxEl);

    // Render attack box if active (red outline)
    if (this.attackBox.active) {
      const attackEl = document.createElement("div");
      attackEl.className = "hitbox-debug";
      Object.assign(attackEl.style, {
        position: "absolute",
        left: this.attackBox.x - this.position.x + "px",
        top: this.attackBox.y - this.position.y + "px",
        width: this.attackBox.width + "px",
        height: this.attackBox.height + "px",
        border: "2px solid red",
        backgroundColor: "rgba(255, 0, 0, 0.3)",
        pointerEvents: "none",
        boxSizing: "border-box",
      });
      this.el.appendChild(attackEl);
    }
  }

  // Reset fighter to initial state
  reset(x) {
    this.health = 100;
    this.position.x = x || this.position.x;
    this.position.y = 400; // Will snap to ground on next update
    this.velocity = { x: 0, y: 0 };
    this.isAttacking = false;
    this.isBlocking = false;
    this.isHurt = false;
    this.attackCooldown = 0;
    this.hurtCooldown = 0;
    this.setState(FIGHTER_STATES.IDLE);

    // Reset defense system
    this.defenseSystem.reset();

    // Reset meters
    this.stamina = this.maxStamina;
  }

  // Clean up DOM element if created/attached
  destroy() {
    if (this.el && this.el.remove) this.el.remove();
    this.el = null;
  }

  // Convenience getters/setters so callers can use fighter.x / fighter.y
  get x() {
    return this.position.x;
  }
  set x(v) {
    this.position.x = v;
  }
  get y() {
    return this.position.y;
  }
  set y(v) {
    this.position.y = v;
  }
}
