import { Fighter } from "./fighter.js";

export class TrainingDummy extends Fighter {
  constructor(config) {
    super({
      name: config.name || "Training Dummy",
      x: config.x ?? 0,
      y: config.y ?? 400,
      characterType: config.characterType || "dummy",
      color: config.color || "#ff4400",
      strength: 0,
      speed: 0,
      defense: 0,
      facing: config.facing || -1,
    });

    this.fixedX = this.position.x;
    this.fixedFacing = config.facing;
  }

  update(dt, input, opponent) {
    this.isMoving = false;
    this.isBlocking = false;
    this.blockHeld = false;

    super.update(dt, input, opponent);

    this.position.x = this.fixedX;
    this.velocity.x = 0;

    this.isAttacking = false;
    this.attackBox.active = false;

    if (typeof this.fixedFacing === "number") {
      this.facing = this.fixedFacing;
    }
  }

  takeDamage(amount, attacker, attackInfo = null) {
    const result = super.takeDamage(amount, attacker, attackInfo);
    this.health = this.maxHealth;

    return result;
  }
}
