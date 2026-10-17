export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = { x: 0, y: 0, active: false };
    this.origin = null;

    this.onKeyDown = (event) => {
      if (this.isSteeringKey(event.code)) {
        this.keys.add(event.code);
        event.preventDefault();
      }
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onPointer = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = event.clientX - rect.left;
      this.pointer.y = event.clientY - rect.top;
      this.pointer.active = true;
    };
    this.onBlur = () => this.keys.clear();

    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("pointerdown", this.onPointer, { passive: true });
    window.addEventListener("blur", this.onBlur);
  }

  isSteeringKey(code) {
    return [
      "KeyW", "KeyA", "KeyS", "KeyD",
      "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
    ].includes(code);
  }

  setSteeringOrigin(x, y) {
    this.origin = { x, y };
  }

  headingFor() {
    let x = 0;
    let y = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) y -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) y += 1;
    if (x || y) return Math.atan2(y, x);

    if (!this.pointer.active) return null;
    const rect = this.canvas.getBoundingClientRect();
    const origin = this.origin ?? { x: rect.width * 0.5, y: rect.height * 0.5 };
    const dx = this.pointer.x - origin.x;
    const dy = this.pointer.y - origin.y;
    return Math.hypot(dx, dy) > 8 ? Math.atan2(dy, dx) : null;
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("pointerdown", this.onPointer);
    window.removeEventListener("blur", this.onBlur);
  }
}
