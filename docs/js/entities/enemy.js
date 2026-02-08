// js/entities/enemy.js
import { Fighter, FIGHTER_STATES } from "./fighter.js";

export class Enemy extends Fighter {
  constructor(config) {
    super(config);
    this.aiState = "idle";
    this.attackRange = 150;
    this.moveSpeed = 150 + this.speed;
    this.aggressiveness = config.aggressiveness || 0.5; // 0-1, how often to attack
    this.difficulty = config.difficulty || "normal";
    this.thinkTime = 0;
    this.decisionInterval = 0.3; // Make decisions every 0.3 seconds

    // Adjust based on difficulty
    this.applyDifficulty();
  }

  applyDifficulty() {
    switch (this.difficulty) {
      case "easy":
        this.moveSpeed *= 0.7;
        this.aggressiveness = 0.3;
        this.decisionInterval = 0.5;
        break;
      case "hard":
        this.moveSpeed *= 1.2;
        this.aggressiveness = 0.7;
        this.decisionInterval = 0.2;
        break;
      case "expert":
        this.moveSpeed *= 1.4;
        this.aggressiveness = 0.85;
        this.decisionInterval = 0.15;
        this.defense += 20;
        break;
    }
  }

  update(dt, input, opponent) {
    if (!opponent || this.health <= 0) {
      super.update(dt, input, opponent);
      return;
    }

    this.thinkTime += dt;

    // AI decision making
    if (
      this.thinkTime >= this.decisionInterval &&
      !this.isHurt &&
      !this.isAttacking
    ) {
      this.thinkTime = 0;
      this.makeDecision(opponent);
    }

    // Execute current AI behavior
    this.executeAI(dt, opponent);

    // Call parent update for physics
    super.update(dt, input, opponent);
  }

  makeDecision(opponent) {
    const distanceToPlayer = Math.abs(opponent.position.x - this.position.x);
    const playerAttacking = opponent.isAttacking;

    // Decide what to do
    if (distanceToPlayer < this.attackRange) {
      // In attack range
      if (playerAttacking && Math.random() < 0.6) {
        // Try to block incoming attack
        this.aiState = "block";
      } else if (Math.random() < this.aggressiveness) {
        // Attack!
        this.aiState = "attack";
      } else {
        // Back off or wait
        this.aiState = Math.random() < 0.5 ? "retreat" : "idle";
      }
    } else if (distanceToPlayer < 300) {
      // Medium range - approach or wait
      if (Math.random() < 0.7) {
        this.aiState = "approach";
      } else {
        this.aiState = "idle";
      }
    } else {
      // Far away - approach
      this.aiState = "approach";
    }
  }

  executeAI(dt, opponent) {
    const distanceToPlayer = opponent.position.x - this.position.x;
    const absDistance = Math.abs(distanceToPlayer);

    this.isMoving = false;

    switch (this.aiState) {
      case "approach":
        // Move toward player
        if (absDistance > this.attackRange * 0.8) {
          if (distanceToPlayer > 0) {
            this.position.x += this.moveSpeed * dt;
            this.facing = 1;
          } else {
            this.position.x -= this.moveSpeed * dt;
            this.facing = -1;
          }
          this.isMoving = true;
        }
        break;

      case "retreat":
        // Move away from player
        if (distanceToPlayer > 0) {
          this.position.x -= this.moveSpeed * 0.7 * dt;
          this.facing = 1;
        } else {
          this.position.x += this.moveSpeed * 0.7 * dt;
          this.facing = -1;
        }
        this.isMoving = true;
        break;

      case "attack":
        if (absDistance < this.attackRange && !this.isBlocking) {
          this.attack();
        }
        this.aiState = "idle";
        break;

      case "block":
        this.block(true);
        // Stop blocking after a short time
        setTimeout(() => {
          this.block(false);
          this.aiState = "idle";
        }, 300);
        break;

      case "idle":
      default:
        // Just face the player
        this.facing = distanceToPlayer > 0 ? 1 : -1;
        break;
    }
  }
}
