export class Engine {
  constructor(updateFn, renderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.paused = false;
    this.lastTime = 0;
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(time) {
    if (this.paused) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.updateFn(dt);
    this.renderFn();

    requestAnimationFrame(this.loop.bind(this));
  }

  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
    this.lastTime = performance.now();
    this.start();
  }
}
