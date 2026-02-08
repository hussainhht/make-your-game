// js/entities/sprite-enemy.js
import { SpriteFighter, SPRITE_FIGHTER_STATES } from "./sprite-fighter.js";

// AI states
const AI_STATES = {
  APPROACHING: "approaching",
  RETREATING: "retreating",
  ATTACKING: "attacking",
  BLOCKING: "blocking",
  IDLE: "idle",
};

export class SpriteEnemy extends SpriteFighter {
  constructor(config) {
    super(config);

    // AI properties
    this.aiState = AI_STATES.IDLE;
    this.decisionTimer = 0;
    this.decisionInterval = 0.3;

    // Difficulty settings
    this.difficulty = config.difficulty || "normal";
    this.applyDifficulty();

    this.moveSpeed = 200 + this.speed * 2; // Pixels per second
    this.aggressiveness = 0.5;
    this.reactionTime = 0.2;
    this.preferredDistance = 150;
    this.dt = 0; // Store dt for AI movement
    this.blockTimer = 0; // Timer for blocking duration
    this.blockDuration = 0; // Duration to block
  }

  applyDifficulty() {
    switch (this.difficulty) {
      case "easy":
        this.aggressiveness = 0.3;
        this.reactionTime = 0.5;
        this.decisionInterval = 0.6;
        this.strength = Math.floor(this.strength * 0.7);
        this.defense = Math.floor(this.defense * 0.7);
        break;
      case "normal":
        this.aggressiveness = 0.5;
        this.reactionTime = 0.3;
        this.decisionInterval = 0.4;
        break;
      case "hard":
        this.aggressiveness = 0.7;
        this.reactionTime = 0.15;
        this.decisionInterval = 0.25;
        this.strength = Math.floor(this.strength * 1.2);
        this.defense = Math.floor(this.defense * 1.2);
        break;
      case "expert":
        this.aggressiveness = 0.85;
        this.reactionTime = 0.1;
        this.decisionInterval = 0.15;
        this.strength = Math.floor(this.strength * 1.3);
        this.defense = Math.floor(this.defense * 1.3);
        break;
      case "boss":
        this.aggressiveness = 0.85;
        this.reactionTime = 0.1;
        this.decisionInterval = 0.2;
        this.strength = Math.floor(this.strength * 1.4);
        this.defense = Math.floor(this.defense * 1.4);
        this.health = 120;
        this.maxHealth = 120;
        break;
    }
  }

  update(dt, input, opponent) {
    if (this.health <= 0 || !opponent) {
      this.isMoving = false;
      super.update(dt, input, opponent);
      return;
    }

    // Store dt for AI movement
    this.dt = dt;

    // AI decision making
    this.decisionTimer += dt;
    if (this.decisionTimer >= this.decisionInterval) {
      this.decisionTimer = 0;
      this.makeDecision(opponent);
    }

    // Execute current AI state
    this.executeAI(opponent);

    super.update(dt, input, opponent);
  }

  // AI decision making based on opponent position and actions
  makeDecision(opponent) {
    if (this.isHurt || this.isAttacking) return;

    const distToPlayer = Math.abs(this.position.x - opponent.position.x);
    const playerIsAttacking = opponent.isAttacking;
    const playerIsApproaching =
      Math.sign(opponent.velocity.x) ===
      -Math.sign(opponent.position.x - this.position.x);
    const healthAdvantage = this.health > opponent.health;

    // React to player attacks
    if (
      playerIsAttacking &&
      distToPlayer < 180 &&
      Math.random() < 1 - this.reactionTime
    ) {
      this.aiState = AI_STATES.BLOCKING;
      this.blockTimer = 0.5 + Math.random() * 0.3; // Set block duration
      return;
    }

    // Decision based on distance
    if (distToPlayer < 100) {
      // Close range
      if (Math.random() < this.aggressiveness) {
        this.aiState = AI_STATES.ATTACKING;
      } else if (Math.random() < 0.4) {
        this.aiState = AI_STATES.RETREATING;
      } else {
        this.aiState = AI_STATES.BLOCKING;
        this.blockTimer = 0.5 + Math.random() * 0.3; // Set block duration
      }
    } else if (distToPlayer < 250) {
      // Medium range
      if (Math.random() < this.aggressiveness * 0.8) {
        this.aiState = AI_STATES.APPROACHING;
      } else if (healthAdvantage) {
        this.aiState = AI_STATES.APPROACHING;
      } else {
        this.aiState =
          Math.random() < 0.5 ? AI_STATES.IDLE : AI_STATES.BLOCKING;
        if (this.aiState === AI_STATES.BLOCKING) {
          this.blockTimer = 0.5 + Math.random() * 0.3; // Set block duration
        }
      }
    } else {
      // Far range
      if (Math.random() < this.aggressiveness) {
        this.aiState = AI_STATES.APPROACHING;
      } else {
        this.aiState = AI_STATES.IDLE;
      }
    }
  }

  executeAI(opponent) {
    if (this.isHurt) {
      this.block(false);
      this.isMoving = false;
      return;
    }

    if (this.isAttacking) {
      this.isMoving = false;
      return;
    }

    const dirToPlayer = Math.sign(opponent.position.x - this.position.x);
    const distToPlayer = Math.abs(this.position.x - opponent.position.x);
    const dt = this.dt || 0.016; // Use stored dt or default to ~60fps

    switch (this.aiState) {
      case AI_STATES.APPROACHING:
        this.block(false);
        this.position.x += dirToPlayer * this.moveSpeed * dt;
        this.facing = dirToPlayer;
        this.isMoving = true;

        // Attack when in range
        if (distToPlayer < 130 && Math.random() < this.aggressiveness * 0.4) {
          this.attack();
        }
        break;

      case AI_STATES.RETREATING:
        this.block(false);
        this.position.x -= dirToPlayer * this.moveSpeed * 0.8 * dt;
        this.isMoving = true;
        break;

      case AI_STATES.ATTACKING:
        this.block(false);
        this.isMoving = false;

        if (distToPlayer < 140) {
          this.attack();
        } else {
          this.position.x += dirToPlayer * this.moveSpeed * dt;
          this.facing = dirToPlayer;
          this.isMoving = true;
        }
        break;

      case AI_STATES.BLOCKING:
        // Update block timer
        if (this.blockTimer > 0) {
          this.blockTimer -= this.dt;
        } else {
          this.block(false);
          this.aiState = AI_STATES.IDLE;
          return;
        }

        this.block(true);
        this.isMoving = false;
        break;

      case AI_STATES.IDLE:
      default:
        this.block(false);
        this.isMoving = false;

        // Occasionally shuffle
        if (Math.random() < 0.02) {
          this.velocity.x = (Math.random() - 0.5) * 3;
        }
        break;
    }
  }
}
