import { Fighter, FIGHTER_STATES } from "./fighter.js";

export class Player extends Fighter {
  constructor(config) {
    super(config);
    this.controls = config.controls || {
      left: ["ArrowLeft", "KeyA"],
      right: ["ArrowRight", "KeyD"],
      jump: ["ArrowUp", "KeyW"],
      attack: ["Space", "KeyJ"],
      heavyAttack: ["KeyU"],
      block: ["ShiftLeft", "KeyK", "ShiftRight"],
      backdash: ["KeyQ"],
      roll: ["KeyE"],
      dodge: ["KeyR"],
    };
    this.moveSpeed = 250 + this.speed * 2;
  }

  update(dt, input, opponent) {
    this.isMoving = false;

    const hasStamina = this.stamina > 0;

    const canAct = !this.isHurt && !this.isAttacking && hasStamina;
    const canMove = canAct && !this.defenseSystem.isInEscapeState();

    if (canMove) {
      if (this.isKeyDown(input, "left")) {
        this.position.x -= this.moveSpeed * dt;
        this.facing = -1;
        this.isMoving = true;
      }
      if (this.isKeyDown(input, "right")) {
        this.position.x += this.moveSpeed * dt;
        this.facing = 1;
        this.isMoving = true;
      }

      if (this.isKeyDown(input, "jump") && this.is_on_ground) {
        this.velocity.y = this.jump_strength;
        this.is_on_ground = false;
      }

      const blocking = this.isKeyDown(input, "block");
      this.block(blocking);

      if (!this.isBlocking) {
        if (this.isKeyJustPressed(input, "attack")) {
          this.attack();
        } else if (this.isKeyJustPressed(input, "heavyAttack")) {
          this.attack();
        }
      }

      if (this.isKeyJustPressed(input, "backdash")) {
        this.backdash();
      }
      if (this.isKeyJustPressed(input, "roll")) {
        this.roll();
      }
      if (this.isKeyJustPressed(input, "dodge")) {
        this.spotDodge();
      }
    }

    super.update(dt, input, opponent);
  }

  isKeyDown(input, action) {
    if (!input) return false;
    const keys = this.controls[action];
    if (!keys) return false;
    return keys.some((key) => input.isDown(key));
  }

  isKeyJustPressed(input, action) {
    if (!input || !input.justPressed) return false;
    const keys = this.controls[action];
    if (!keys) return false;
    return keys.some((key) => input.justPressed(key));
  }
}
