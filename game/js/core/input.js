export class Input {
  constructor() {
    this.keys = {};
    this.previousKeys = {};
    this.justPressedKeys = {};

    window.addEventListener("keydown", (e) => {
      if (!this.keys[e.code]) {
        this.justPressedKeys[e.code] = true;
      }
      this.keys[e.code] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
  }

  isDown(key) {
    return !!this.keys[key];
  }

  isPressed(key) {
    return !!this.keys[key];
  }

  justPressed(key) {
    return !!this.justPressedKeys[key];
  }

  justReleased(key) {
    return !this.keys[key] && this.previousKeys[key];
  }

  update() {
    this.previousKeys = { ...this.keys };
    this.justPressedKeys = {};
  }
}
