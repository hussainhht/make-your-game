// js/entities/sprite-fighter.js
import { applyGravity } from "../core/physics.js";
import {
  DefenseSystem,
  DEFENSE_STATE,
  createAttack,
} from "../core/combat-system.js";

// Fighter states
export const SPRITE_FIGHTER_STATES = {
  IDLE: "idle",
  RUNNING: "running",
  ATTACKING: "attacking",
  HURT: "hurt",
  BLOCKING: "blocking",
  BACKDASH: "idle",
  ROLL: "idle",
  DODGE: "idle",
  DEAD: "dead",
};

export class SpriteFighter {
  constructor(config) {
    this.name = config.name || "Fighter";
    this.position = { x: config.x ?? 100, y: config.y ?? 300 };
    this.velocity = { x: 0, y: 0 };

    // Get sprite config from config or use defaults
    const spriteConfig = config.spriteConfig || {};
    const basePath = spriteConfig.basePath || "assets/Sprites/";
    const animConfig = spriteConfig.animations || {};

    // Sprite dimensions (configurable per character)
    this.spriteWidth = spriteConfig.spriteWidth || 96;
    this.spriteHeight = spriteConfig.spriteHeight || 96;

    // Display scale (how big to render on screen)
    this.scale = config.scale || 2.5;
    this.width = this.spriteWidth * this.scale;
    this.height = this.spriteHeight * this.scale;

    // Core properties
    this.health = 100;
    this.maxHealth = 100;
    this.facing = config.facing || 1; // 1 = right, -1 = left
    this.is_on_ground = true;
    this.jump_strength = -10;

    // Stats
    this.strength = config.strength || 75;
    this.speed = config.speed || 80;
    this.defense = config.defense || 65;

    // State machine
    this.state = SPRITE_FIGHTER_STATES.IDLE;
    this.isMoving = false;
    this.isAttacking = false;
    this.isBlocking = false;
    this.isHurt = false;
    this.attackCooldown = 0;
    this.hurtCooldown = 0;

    // =========================================================================
    // DEFENSE SYSTEM INTEGRATION
    // =========================================================================
    this.defenseSystem = new DefenseSystem(this);

    // Stamina for escape options
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaRegenRate = 15;
    this.staminaRegenDelay = 0.5;
    this.staminaRegenTimer = 0;

    // Animation system - use custom config or defaults
    this.animations = {
      idle: {
        src: basePath + (animConfig.idle?.src || "IDLE.png"),
        frames: animConfig.idle?.frames || 10,
        frameDuration: animConfig.idle?.frameDuration || 0.1,
        loop: true,
      },
      running: {
        src: basePath + (animConfig.running?.src || "RUN.png"),
        frames: animConfig.running?.frames || 16,
        frameDuration: animConfig.running?.frameDuration || 0.05,
        loop: true,
      },
      attacking: {
        src: basePath + (animConfig.attacking?.src || "ATTACK 1.png"),
        frames: animConfig.attacking?.frames || 7,
        frameDuration: animConfig.attacking?.frameDuration || 0.06,
        loop: false,
      },
      hurt: {
        src: basePath + (animConfig.hurt?.src || "HURT.png"),
        frames: animConfig.hurt?.frames || 4,
        frameDuration: animConfig.hurt?.frameDuration || 0.1,
        loop: false,
      },
      blocking: {
        src: basePath + (animConfig.blocking?.src || "IDLE.png"),
        frames: animConfig.blocking?.frames || 1,
        frameDuration: animConfig.blocking?.frameDuration || 0.1,
        loop: true,
      },
      // perfect_block animation removed
      backdash: {
        src: basePath + (animConfig.backdash?.src || "RUN.png"),
        frames: animConfig.backdash?.frames || 16,
        frameDuration: animConfig.backdash?.frameDuration || 0.05,
        loop: true,
      },
      roll: {
        src: basePath + (animConfig.roll?.src || "RUN.png"),
        frames: animConfig.roll?.frames || 16,
        frameDuration: animConfig.roll?.frameDuration || 0.03,
        loop: true,
      },
      dodge: {
        src: basePath + (animConfig.dodge?.src || "IDLE.png"),
        frames: animConfig.dodge?.frames || 10,
        frameDuration: animConfig.dodge?.frameDuration || 0.05,
        loop: true,
      },
    };

    // Add dead animation only if configured (sprits2 characters have it)
    if (animConfig.dead) {
      this.animations.dead = {
        src: basePath + animConfig.dead.src,
        frames: animConfig.dead.frames || 3,
        frameDuration: animConfig.dead.frameDuration || 0.15,
        loop: false,
      };
    }

    // Add additional attack animations if configured (sprits2 characters have them)
    if (animConfig.attacking2) {
      this.animations.attacking2 = {
        src: basePath + animConfig.attacking2.src,
        frames: animConfig.attacking2.frames || 3,
        frameDuration: animConfig.attacking2.frameDuration || 0.1,
        loop: false,
      };
    }
    if (animConfig.attacking3) {
      this.animations.attacking3 = {
        src: basePath + animConfig.attacking3.src,
        frames: animConfig.attacking3.frames || 4,
        frameDuration: animConfig.attacking3.frameDuration || 0.08,
        loop: false,
      };
    }

    // Track current attack animation for combo variety
    this.currentAttackAnim = "attacking";

    this.currentFrame = 0;
    this.frameTime = 0;
    this.animationComplete = false;

    // Hitboxes
    this.hitbox = {
      x: 0,
      y: 0,
      width: this.width * 0.4,
      height: this.height * 0.9,
    };

    this.attackBox = {
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      active: false,
      damage: 12,
    };

    // DOM element
    this.el = null;
    this.spriteEl = null;

    // Preload images
    this.loadedImages = {};
    this.preloadImages();
  }

  preloadImages() {
    Object.keys(this.animations).forEach((animName) => {
      const anim = this.animations[animName];
      const img = new Image();
      img.src = anim.src;
      this.loadedImages[animName] = img;
    });
  }

  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.currentFrame = 0;
      this.frameTime = 0;
      this.animationComplete = false;
    }
  }

  update(dt, input, opponent) {
    // If dead, only update animation and stop everything else
    if (this.state === SPRITE_FIGHTER_STATES.DEAD) {
      this.updateAnimation(dt);
      return;
    }

    // Update timers
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.hurtCooldown > 0) this.hurtCooldown -= dt;

    // Update defense system
    this.defenseSystem.update(dt, input);

    // Update stamina regeneration
    this.updateStamina(dt);

    // Apply gravity
    applyGravity(this, dt);

    // Apply vertical velocity (gravity/jumping)
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

    // Handle state transitions
    if (this.isHurt && this.hurtCooldown <= 0) {
      this.isHurt = false;
      this.setState(SPRITE_FIGHTER_STATES.IDLE);
    }

    if (this.isAttacking && this.animationComplete) {
      this.isAttacking = false;
      this.attackBox.active = false;
      this.setState(SPRITE_FIGHTER_STATES.IDLE);
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
      !this.isHurt &&
      !this.isBlocking &&
      this.defenseSystem.state === DEFENSE_STATE.NEUTRAL;
    if (canUpdateState) {
      if (this.isMoving) {
        this.setState(SPRITE_FIGHTER_STATES.RUNNING);
      } else if (!this.is_on_ground) {
        this.setState(SPRITE_FIGHTER_STATES.IDLE);
      } else {
        this.setState(SPRITE_FIGHTER_STATES.IDLE);
      }
    }
  }

  updateStamina(dt) {
    if (this.stamina < this.maxStamina) {
      this.staminaRegenTimer += dt;
      if (this.staminaRegenTimer >= this.staminaRegenDelay) {
        this.stamina = Math.min(
          this.maxStamina,
          this.stamina + this.staminaRegenRate * dt,
        );
      }
    }
  }

  syncDefenseState() {
    const ds = this.defenseSystem;

    // Only sync blocking state from defense system
    this.isBlocking = ds.isBlocking();

    // Only override fighter state for special defense states
    // Don't override during attacks or hurt
    if (this.isAttacking || this.isHurt) return;

    // Map special defense states to fighter states
    switch (ds.state) {
      case DEFENSE_STATE.BACKDASH:
        this.setState(SPRITE_FIGHTER_STATES.BACKDASH);
        break;
      case DEFENSE_STATE.ROLL:
        this.setState(SPRITE_FIGHTER_STATES.ROLL);
        break;
      case DEFENSE_STATE.SPOT_DODGE:
        this.setState(SPRITE_FIGHTER_STATES.DODGE);
        break;
      // Don't override for NEUTRAL and STANDING_BLOCK
      // Those are handled by the block() method and normal state updates
    }
  }

  updateHitbox() {
    // Center hitbox on fighter
    this.hitbox.x = this.position.x + (this.width - this.hitbox.width) / 2;
    this.hitbox.y = this.position.y + this.height * 0.1;

    // Position attack box in front of fighter
    if (this.attackBox.active) {
      if (this.facing === 1) {
        this.attackBox.x = this.position.x + this.width * 0.6;
      } else {
        this.attackBox.x =
          this.position.x - this.attackBox.width + this.width * 0.4;
      }
      this.attackBox.y = this.position.y + this.height * 0.3;
    }
  }

  updateAnimation(dt) {
    // Use currentAttackAnim for attacking state, otherwise use state name
    const animKey =
      this.state === SPRITE_FIGHTER_STATES.ATTACKING
        ? this.currentAttackAnim
        : this.state;
    const anim = this.animations[animKey];
    if (!anim) return;

    this.frameTime += dt;

    if (this.frameTime >= anim.frameDuration) {
      this.frameTime = 0;

      if (this.currentFrame < anim.frames - 1) {
        this.currentFrame++;

        // Activate attack hitbox at the right frame (middle of animation)
        if (
          this.state === SPRITE_FIGHTER_STATES.ATTACKING &&
          this.currentFrame === Math.floor(anim.frames / 2)
        ) {
          this.attackBox.active = true;
          setTimeout(() => {
            this.attackBox.active = false;
          }, 100);
        }
      } else {
        if (anim.loop) {
          this.currentFrame = 0;
        } else {
          this.animationComplete = true;
        }
      }
    }
  }

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
    this.attackCooldown = 0.5;
    this.currentFrame = 0;
    this.animationComplete = false;
    this.attackBox.damage = Math.floor(12 + this.strength / 8);
    this.currentAttackAnim = "attacking";

    if (this.animations.attacking2 && this.animations.attacking3) {
      const attackAnims = ["attacking", "attacking2", "attacking3"];
      this.currentAttackAnim =
        attackAnims[Math.floor(Math.random() * attackAnims.length)];
    } else {
      this.currentAttackAnim = "attacking";
    }

    this.setState(SPRITE_FIGHTER_STATES.ATTACKING);
  }

  block(active) {
    if (this.isAttacking || this.isHurt) return;

    if (active) {
      this.defenseSystem.setState(DEFENSE_STATE.STANDING_BLOCK);
      this.isBlocking = true;
      this.setState(SPRITE_FIGHTER_STATES.BLOCKING);
    } else {
      // Release block
      this.defenseSystem.setState(DEFENSE_STATE.NEUTRAL);
      this.isBlocking = false;
      if (this.state === SPRITE_FIGHTER_STATES.BLOCKING) {
        this.setState(SPRITE_FIGHTER_STATES.IDLE);
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
    if (this.hurtCooldown > 0 || this.health <= 0)
      return { damage: 0, blocked: false };

    // Create attack object if not provided
    const attack =
      attackInfo ||
      createAttack({
        damage: amount,
      });

    // Check for block - use defense system state
    if (this.defenseSystem.isBlocking()) {
      const blockResult = this.defenseSystem.attemptBlock(attack);

      if (blockResult.blocked) {
        // Apply chip damage
        if (blockResult.chipDamage > 0) {
          this.health = Math.max(1, this.health - blockResult.chipDamage);
        }

        // Apply pushback
        this.velocity.x = attacker.facing * blockResult.pushback;

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
    this.velocity.x = attacker.facing * 8;

    // Enter hurt state
    this.isHurt = true;
    this.hurtCooldown = 0.4;
    this.isAttacking = false;
    this.attackBox.active = false;
    this.currentFrame = 0;
    this.animationComplete = false;
    this.setState(SPRITE_FIGHTER_STATES.HURT);

    this.health = Math.max(0, this.health - actualDamage);

    // Trigger death animation if health reaches 0 and dead animation exists
    if (this.health <= 0 && this.animations.dead) {
      this.isHurt = false;
      this.currentFrame = 0;
      this.animationComplete = false;
      this.setState(SPRITE_FIGHTER_STATES.DEAD);
    }

    return {
      damage: actualDamage,
      blocked: false,
    };
  }

  consumeStamina(amount) {
    if (this.stamina >= amount) {
      this.stamina -= amount;
      this.staminaRegenTimer = 0;
      return true;
    }
    return false;
  }

  isAttackHitting(opponent) {
    if (!this.attackBox.active) return false;

    return (
      this.attackBox.x < opponent.hitbox.x + opponent.hitbox.width &&
      this.attackBox.x + this.attackBox.width > opponent.hitbox.x &&
      this.attackBox.y < opponent.hitbox.y + opponent.hitbox.height &&
      this.attackBox.y + this.attackBox.height > opponent.hitbox.y
    );
  }

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

    // Create sprite element
    this.spriteEl = document.createElement("div");
    Object.assign(this.spriteEl.style, {
      position: "absolute",
      width: "100%",
      height: "100%",
      backgroundRepeat: "no-repeat",
      imageRendering: "pixelated",
    });
    this.el.appendChild(this.spriteEl);

    this.render();
  }

  render(debugHitboxes = false) {
    if (!this.el || !this.spriteEl) return;

    // Position and flip
    const scaleX = this.facing;
    this.el.style.transform = `translate(${Math.round(
      this.position.x,
    )}px, ${Math.round(this.position.y)}px) scaleX(${scaleX})`;

    // Update sprite - use currentAttackAnim for attacking state
    const animKey =
      this.state === SPRITE_FIGHTER_STATES.ATTACKING
        ? this.currentAttackAnim
        : this.state;
    const anim = this.animations[animKey];
    if (anim) {
      const frameX = this.currentFrame * this.spriteWidth;
      this.spriteEl.style.backgroundImage = `url('${anim.src}')`;
      this.spriteEl.style.backgroundPosition = `-${frameX * this.scale}px 0`;

      // For blocking with 1 frame using idle sprite, use idle's full sheet size
      // This fixes characters that don't have a dedicated shield animation
      let sheetFrames = anim.frames;
      if (animKey === "blocking" && anim.frames === 1 && this.animations.idle) {
        // Check if blocking uses the same sprite as idle
        if (anim.src === this.animations.idle.src) {
          sheetFrames = this.animations.idle.frames;
        }
      }

      this.spriteEl.style.backgroundSize = `${
        sheetFrames * this.spriteWidth * this.scale
      }px ${this.height}px`;
    }

    // Block effect
    if (this.isBlocking) {
      this.spriteEl.style.filter = "brightness(0.7) saturate(0.5)";
    } else if (this.isHurt) {
      this.spriteEl.style.filter = "brightness(2) saturate(0.3)";
    } else {
      this.spriteEl.style.filter = "none";
    }

    if (debugHitboxes) {
      this.renderHitboxes();
    }
  }

  renderHitboxes() {
    // Remove old debug elements
    const oldDebug = this.el.querySelectorAll(".hitbox-debug");
    oldDebug.forEach((el) => el.remove());

    // Main hitbox
    const hitboxEl = document.createElement("div");
    hitboxEl.className = "hitbox-debug";
    Object.assign(hitboxEl.style, {
      position: "absolute",
      left: this.hitbox.x - this.position.x + "px",
      top: this.hitbox.y - this.position.y + "px",
      width: this.hitbox.width + "px",
      height: this.hitbox.height + "px",
      border: "2px solid lime",
      pointerEvents: "none",
      boxSizing: "border-box",
      opacity: "0.5",
    });
    this.el.appendChild(hitboxEl);

    // Attack hitbox
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

  reset(x) {
    this.health = this.maxHealth;
    this.position.x = x || this.position.x;
    this.position.y = 300; // Will snap to ground on next update
    this.velocity = { x: 0, y: 0 };
    this.isAttacking = false;
    this.isBlocking = false;
    this.isHurt = false;
    this.attackCooldown = 0;
    this.hurtCooldown = 0;
    this.currentFrame = 0;
    this.animationComplete = false;
    this.setState(SPRITE_FIGHTER_STATES.IDLE);

    // Reset defense system
    this.defenseSystem.reset();

    // Reset meters
    this.stamina = this.maxStamina;
  }

  destroy() {
    if (this.el && this.el.remove) this.el.remove();
    this.el = null;
  }

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
