const KEY_MAP = Object.freeze({
  KeyW: "up",
  ArrowUp: "up",
  w: "up",
  W: "up",
  KeyS: "down",
  ArrowDown: "down",
  s: "down",
  S: "down",
  KeyA: "left",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  KeyD: "right",
  ArrowRight: "right",
  d: "right",
  D: "right",
});

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = {
      x: 0,
      y: 0,
      active: false,
      down: false,
      type: "mouse",
      updatedAt: -Infinity,
    };
    this.touchStart = null;
    this.latchedHeading = null;
    this.origin = null;

    this.onKeyDown = (event) => {
      const dir = this.directionForEvent(event);
      if (!dir) return;
      if (this.isOverlayInteractive(event.target)) return;
      this.keys.add(dir);
      if (!this.pointer.down) {
        this.pointer.active = false;
      }
      event.preventDefault();
    };

    this.onKeyUp = (event) => {
      const dir = this.directionForEvent(event);
      if (dir) this.keys.delete(dir);
    };

    this.onPointerDown = (event) => {
      if (this.isOverlayInteractive(event.target)) return;
      const pos = this.canvasCoords(event.clientX, event.clientY);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
      this.pointer.active = true;
      this.pointer.down = true;
      this.pointer.type = event.pointerType || "mouse";
      this.pointer.updatedAt = performance.now();
      this.touchStart = { x: pos.x, y: pos.y };

      const angle = this.computePointerAngle();
      if (angle !== null) this.latchedHeading = angle;
    };

    this.onPointerMove = (event) => {
      if (this.isOverlayInteractive(event.target) && !this.pointer.down) return;
      const pos = this.canvasCoords(event.clientX, event.clientY);
      const moved = Math.hypot(pos.x - this.pointer.x, pos.y - this.pointer.y);
      if (this.keys.size > 0 && !this.pointer.down && moved < 2.5) return;

      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
      this.pointer.active = true;
      this.pointer.type = event.pointerType || this.pointer.type || "mouse";
      this.pointer.updatedAt = performance.now();

      const angle = this.computePointerAngle();
      if (angle !== null) this.latchedHeading = angle;
    };

    this.onPointerUp = (event) => {
      this.pointer.down = false;
      if (event.pointerType === "touch" || this.pointer.type === "touch") {
        this.pointer.active = false;
        this.touchStart = null;
      }
    };

    this.onTouchStart = (event) => {
      if (this.isOverlayInteractive(event.target)) return;
      if (!event.touches || event.touches.length === 0) return;
      const touch = event.touches[0];
      const pos = this.canvasCoords(touch.clientX, touch.clientY);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
      this.pointer.active = true;
      this.pointer.down = true;
      this.pointer.type = "touch";
      this.pointer.updatedAt = performance.now();
      this.touchStart = { x: pos.x, y: pos.y };

      const angle = this.computePointerAngle();
      if (angle !== null) this.latchedHeading = angle;
      if (event.cancelable) event.preventDefault();
    };

    this.onTouchMove = (event) => {
      if (this.isOverlayInteractive(event.target) && !this.pointer.down) return;
      if (!event.touches || event.touches.length === 0) return;
      const touch = event.touches[0];
      const pos = this.canvasCoords(touch.clientX, touch.clientY);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
      this.pointer.active = true;
      this.pointer.down = true;
      this.pointer.type = "touch";
      this.pointer.updatedAt = performance.now();

      const angle = this.computePointerAngle();
      if (angle !== null) this.latchedHeading = angle;
      if (event.cancelable) event.preventDefault();
    };

    this.onTouchEnd = (event) => {
      if (!event.touches || event.touches.length === 0) {
        this.pointer.down = false;
        this.pointer.active = false;
        this.touchStart = null;
      }
    };

    this.onBlur = () => {
      this.keys.clear();
      this.pointer.down = false;
    };

    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerup", this.onPointerUp, { passive: true });
    window.addEventListener("pointercancel", this.onPointerUp, { passive: true });
    window.addEventListener("touchstart", this.onTouchStart, { passive: false });
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("touchend", this.onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", this.onTouchEnd, { passive: true });
    window.addEventListener("blur", this.onBlur);
  }

  directionForEvent(event) {
    return KEY_MAP[event.code] || KEY_MAP[event.key] || null;
  }

  isSteeringKey(code) {
    return Boolean(KEY_MAP[code]);
  }

  isOverlayInteractive(target) {
    if (!target || typeof target.closest !== "function") return false;
    return Boolean(target.closest("button, [data-hud='overlay']:not([hidden])"));
  }

  canvasCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  getOrigin() {
    if (this.origin) return this.origin;
    const rect = this.canvas.getBoundingClientRect();
    return { x: rect.width * 0.5, y: rect.height * 0.5 };
  }

  setSteeringOrigin(x, y) {
    this.origin = { x, y };
  }

  reset() {
    this.keys.clear();
    this.pointer.active = false;
    this.pointer.down = false;
    this.touchStart = null;
    this.latchedHeading = null;
  }

  computePointerAngle() {
    if (!this.pointer.active) return null;
    const origin = this.getOrigin();
    const dx = this.pointer.x - origin.x;
    const dy = this.pointer.y - origin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 8) return Math.atan2(dy, dx);

    if (this.pointer.type === "touch" && this.touchStart) {
      const dragX = this.pointer.x - this.touchStart.x;
      const dragY = this.pointer.y - this.touchStart.y;
      if (Math.hypot(dragX, dragY) > 10) return Math.atan2(dragY, dragX);
    }
    return null;
  }

  headingFor() {
    let kx = 0;
    let ky = 0;
    if (this.keys.has("left")) kx -= 1;
    if (this.keys.has("right")) kx += 1;
    if (this.keys.has("up")) ky -= 1;
    if (this.keys.has("down")) ky += 1;

    const hasKeys = kx !== 0 || ky !== 0;
    const pointerAngle = this.computePointerAngle();

    if (hasKeys) {
      const keyLen = Math.hypot(kx, ky);
      const nkx = kx / keyLen;
      const nky = ky / keyLen;
      const pointerFresh = this.pointer.active
        && pointerAngle !== null
        && (this.pointer.down || performance.now() - this.pointer.updatedAt < 160);

      if (pointerFresh) {
        const px = Math.cos(pointerAngle);
        const py = Math.sin(pointerAngle);
        const bx = px * 0.42 + nkx * 0.88;
        const by = py * 0.42 + nky * 0.88;
        if (Math.hypot(bx, by) > 0.05) {
          this.latchedHeading = null;
          return Math.atan2(by, bx);
        }
      }

      this.latchedHeading = null;
      return Math.atan2(nky, nkx);
    }

    if (pointerAngle !== null) {
      this.latchedHeading = null;
      return pointerAngle;
    }

    if (this.latchedHeading !== null) {
      const latched = this.latchedHeading;
      this.latchedHeading = null;
      return latched;
    }

    return null;
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("touchstart", this.onTouchStart);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("touchend", this.onTouchEnd);
    window.removeEventListener("touchcancel", this.onTouchEnd);
    window.removeEventListener("blur", this.onBlur);
  }
}
