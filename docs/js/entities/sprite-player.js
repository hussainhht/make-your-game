// js/entities/sprite-player.js
import { SpriteFighter, SPRITE_FIGHTER_STATES } from "./sprite-fighter.js";

export class SpritePlayer extends SpriteFighter {
  constructor(config) {
    super(config);
    this.moveSpeed = 300 + this.speed * 2; // Pixels per second
  }

  handleInput(input, dt) {
    if (!input) return;
    if (this.health <= 0) return;
    if (this.isHurt) return;

    // Can't do much while attacking or in escape states
    if (this.isAttacking || this.defenseSystem.isInEscapeState()) {
      this.isMoving = false;
      return;
    }

    // Blocking
    if (
      input.isDown("ShiftLeft") ||
      input.isDown("ShiftRight") ||
      input.isDown("KeyK")
    ) {
      this.block(true);
      this.isMoving = false;
      return;
    } else {
      this.block(false);
    }

    // Defense options (before movement)
    if (input.justPressed("KeyQ")) {
      this.backdash();
      return;
    }
    if (input.justPressed("KeyE")) {
      this.roll();
      return;
    }
    if (input.justPressed("KeyR")) {
      this.spotDodge();
      return;
    }

    // Movement - use dt for frame-independent movement
    let moving = false;

    // Left
    if (input.isDown("KeyA") || input.isDown("ArrowLeft")) {
      this.position.x -= this.moveSpeed * dt;
      this.facing = -1;
      moving = true;
    }
    // Right
    if (input.isDown("KeyD") || input.isDown("ArrowRight")) {
      this.position.x += this.moveSpeed * dt;
      this.facing = 1;
      moving = true;
    }

    this.isMoving = moving;

    // Jump
    if (
      (input.isDown("KeyW") || input.isDown("ArrowUp")) &&
      this.is_on_ground
    ) {
      this.velocity.y = this.jump_strength;
      this.is_on_ground = false;
    }

    // Attack - use J key or Space when not jumping
    if (input.justPressed("KeyJ") || input.justPressed("Space")) {
      if (this.is_on_ground) {
        this.attack();
      }
    }

    // Heavy attack
    if (input.justPressed("KeyU")) {
      if (this.is_on_ground) {
        this.attack();
      }
    }
  }

  update(dt, input, opponent) {
    this.handleInput(input, dt);
    super.update(dt, input, opponent);
  }
}
