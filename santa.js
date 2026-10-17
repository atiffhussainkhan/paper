/* Santa — single character module for Santa's Visit.
 *
 * One API used everywhere: Santa.build(pose) + Santa.toCanvas / toSVG.
 * Vector art is the default (free, private, always available). If pose PNGs
 * are dropped into assets/santa/, the same API switches to those images —
 * no second character module, no parallel PhotorealSanta path.
 */
(function (global) {
  "use strict";

  const C = {
    suit: "#d32f2f", suitDark: "#a01f1f", suitLight: "#ef5350",
    trim: "#fbf7f0", trimShade: "#ddd6c8",
    skin: "#f2c6a0", skinShade: "#dcae86",
    beard: "#fbf7f0", beardShade: "#e2ddd2",
    hat: "#d32f2f", hatDark: "#a01f1f",
    boot: "#2f2a2a", belt: "#2f2a2a", buckle: "#f5c451",
    cheek: "#e88b7a", nose: "#e8a07c",
    eye: "#26201e", glass: "#eef4f7", milk: "#ffffff",
    cookie: "#d9a15b", cookieChip: "#6b4423",
  };

  const REQUIRED_PHOTOS = ["stand", "walk", "walk2", "sit", "reach", "drink", "eat", "wave", "cheer"];
  const photoState = {
    images: {},
    loaded: false,
    missing: REQUIRED_PHOTOS.slice(),
    sourceHeight: 0,
  };

  const S = [];
  const push = (o) => { S.push(o); return o; };
  const circle = (cx, cy, r, fill, extra) =>
    push(Object.assign({ t: "circle", cx, cy, r, fill }, extra));
  const ellipse = (cx, cy, rx, ry, fill, extra) =>
    push(Object.assign({ t: "ellipse", cx, cy, rx, ry, fill }, extra));
  const rect = (x, y, w, h, fill, extra) =>
    push(Object.assign({ t: "rect", x, y, w, h, fill }, extra));
  const path = (d, fill, extra) => push(Object.assign({ t: "path", d, fill }, extra));
  const line = (x1, y1, x2, y2, stroke, w, extra) =>
    push(Object.assign({ t: "line", x1, y1, x2, y2, stroke, sw: w, cap: "round" }, extra));

  function limb(x1, y1, x2, y2, w, colour) {
    line(x1, y1, x2, y2, colour, w);
  }

  const POSES = {
    stand: { armL: 8, armR: -8, legs: 0, sit: 0, head: 0, hold: null },
    walk: { armL: 22, armR: -22, legs: 1, sit: 0, head: 0, hold: null },
    walk2: { armL: -16, armR: 16, legs: -1, sit: 0, head: 0, hold: null },
    sit: { armL: 14, armR: -14, legs: 0, sit: 1, head: -2, hold: null },
    reach: { armL: 10, armR: -70, legs: 0, sit: 1, head: 8, hold: null },
    drink: { armL: 10, armR: -48, legs: 0, sit: 1, head: 8, hold: "glass" },
    eat: { armL: 10, armR: -40, legs: 0, sit: 1, head: 4, hold: "cookie" },
    cheer: { armL: 140, armR: 150, legs: 0, sit: 0, head: -4, hold: null },
    wave: { armL: 14, armR: 128, legs: 0, sit: 0, head: -4, hold: null },
  };

  function buildVector(poseName) {
    S.length = 0;
    const p = POSES[poseName] || POSES.stand;
    const sitting = p.sit === 1;

    // Local space: feet at y≈22 when standing; hips at y=0 when seated so the
    // engine can pin the seat cushion to the sofa marker.
    const hipY = sitting ? 0 : -34;
    const shoulderY = hipY - 24;
    const neckY = shoulderY - 4;
    const headY = neckY - 10;
    const swing = p.legs * 7;

    if (sitting) {
      // Thighs along the seat, shins down to the floor in front of the sofa.
      limb(-6, hipY, 16, hipY + 1, 10, C.suitDark);
      limb(16, hipY + 1, 18, hipY + 24, 8.5, C.suitDark);
      ellipse(19, hipY + 26, 10, 4.8, C.boot);
    } else {
      limb(-6, hipY, -6 + swing, hipY + 22, 9.5, C.suitDark);
      ellipse(-6 + swing, hipY + 24, 8, 4.4, C.boot);
    }

    // Rounder, friendlier belly — kids should read "jolly Santa", not a stick.
    path(
      `M -14 ${shoulderY + 2}
       Q -20 ${hipY - 8} -14 ${hipY + 2}
       L 14 ${hipY + 2}
       Q 20 ${hipY - 8} 14 ${shoulderY + 2}
       Q 8 ${shoulderY - 5} 0 ${shoulderY - 5}
       Q -8 ${shoulderY - 5} -14 ${shoulderY + 2} Z`,
      C.suit, { grad: "suit" }
    );
    path(
      `M -9 ${shoulderY + 3} Q -12 ${hipY - 10} -6 ${hipY}
       L 0 ${hipY} Q -6 ${hipY - 12} -4 ${shoulderY + 2} Z`,
      C.suitLight, { opacity: "0.45" }
    );
    line(0, shoulderY + 2, 0, hipY, C.trim, 3.6);
    rect(-14, hipY - 9, 28, 7, C.belt, { rx: 1.5 });
    rect(-4.5, hipY - 10, 9, 8, C.buckle, { rx: 1.8 });
    line(-13, hipY + 1, 13, hipY + 1, C.trim, 3.2);

    // Head
    path(`M -13 ${headY} a 13 13 0 1 0 26 0 a 13 13 0 1 0 -26 0`, C.skin, { grad: "skin" });
    circle(-4, headY - 2, 12, C.skinShade, { opacity: "0.16" });
    circle(-13, headY + 1, 3.2, C.skin);
    circle(13, headY + 1, 3.2, C.skin);
    circle(-7.5, headY + 3.5, 3.4, C.cheek, { opacity: "0.6" });
    circle(7.5, headY + 3.5, 3.4, C.cheek, { opacity: "0.6" });
    // Bright eyes with tiny highlights
    circle(-4.8, headY - 1.2, 2.1, C.eye);
    circle(4.8, headY - 1.2, 2.1, C.eye);
    circle(-4.1, headY - 1.8, 0.7, "#ffffff");
    circle(5.5, headY - 1.8, 0.7, "#ffffff");
    circle(0, headY + 2.2, 3.6, C.nose);

    // Fluffy beard
    path(
      `M -12 ${headY - 1}
       Q -14 ${headY + 10} -8 ${headY + 15}
       Q -3 ${headY + 19} 0 ${headY + 15}
       Q 3 ${headY + 19} 8 ${headY + 15}
       Q 14 ${headY + 10} 12 ${headY - 1}
       Q 6 ${headY + 3} 0 ${headY + 3}
       Q -6 ${headY + 3} -12 ${headY - 1} Z`,
      C.beard, { grad: "trim" }
    );
    path(
      `M -8 ${headY + 1} Q 0 ${headY - 1} 8 ${headY + 1}
       Q 0 ${headY + 6} -8 ${headY + 1} Z`,
      C.beardShade, { opacity: "0.5" }
    );
    // Big friendly smile
    path(`M -5 ${headY + 6.5} Q 0 ${headY + 10} 5 ${headY + 6.5}`,
         "none", { stroke: C.eye, sw: 1.6, fill: "none", cap: "round" });

    // Hat
    path(
      `M -14 ${headY - 7} Q -10 ${headY - 24} 3 ${headY - 28}
       Q 13 ${headY - 27} 16 ${headY - 18}
       Q 4 ${headY - 23} -4 ${headY - 17} Z`,
      C.hat, { grad: "suit" }
    );
    path(`M -11 ${headY - 11} Q -6 ${headY - 21} 5 ${headY - 27}
          L 7 ${headY - 23} Q -4 ${headY - 19} -8 ${headY - 10} Z`,
         C.hatDark, { opacity: "0.32" });
    circle(16, headY - 18, 4.5, C.trim);
    path(`M -15 ${headY - 9} Q 0 ${headY - 15} 15 ${headY - 9}
           Q 16 ${headY - 3} 0 ${headY - 4} Q -16 ${headY - 3} -15 ${headY - 9} Z`,
         C.trim);

    const arm = (side, deg) => {
      const rad = (deg * Math.PI) / 180;
      const sx = side * 13;
      const ex = sx + side * Math.sin(rad) * 24;
      const ey = shoulderY + 2 + Math.cos(rad) * 24;
      limb(sx, shoulderY + 2, ex, ey, 8, C.suitDark);
      circle(ex, ey, 4.6, C.trim);
      circle(ex + (ex - sx) * 0.2, ey + (ey - shoulderY) * 0.2, 3.5, C.trim);
      return { x: ex, y: ey };
    };
    const handL = arm(-1, p.armL);
    const handR = arm(1, p.armR);

    if (sitting) {
      limb(6, hipY, 22, hipY + 1, 10, C.suit);
      limb(22, hipY + 1, 24, hipY + 24, 8.5, C.suit);
      ellipse(25, hipY + 26, 10, 4.8, C.boot);
    } else {
      limb(6, hipY, 6 - swing, hipY + 22, 9.5, C.suit);
      ellipse(6 - swing, hipY + 24, 8, 4.4, C.boot);
    }

    if (p.hold === "glass") {
      const gx = handR.x, gy = handR.y;
      path(`M ${gx - 4} ${gy - 4} L ${gx + 4} ${gy - 4}
             L ${gx + 3} ${gy + 5} L ${gx - 3} ${gy + 5} Z`, C.glass,
           { stroke: "#9fb3bd", sw: 0.8 });
      path(`M ${gx - 3.2} ${gy - 1.5} L ${gx + 3.2} ${gy - 1.5}
             L ${gx + 2.6} ${gy + 4.4} L ${gx - 2.6} ${gy + 4.4} Z`, C.milk);
    }
    if (p.hold === "cookie") {
      const gx = handR.x, gy = handR.y;
      circle(gx, gy, 5.2, C.cookie);
      circle(gx - 2, gy - 1.5, 1.1, C.cookieChip);
      circle(gx + 2, gy + 1, 1.1, C.cookieChip);
      circle(gx + 0.5, gy - 2.5, 0.9, C.cookieChip);
    }

    return S.slice();
  }

  /* ---------- optional photo assets (same Santa API) ---------- */
  function loadPhotos(onProgress) {
    const names = REQUIRED_PHOTOS.slice();
    let done = 0;
    photoState.missing = [];
    photoState.images = {};
    photoState.loaded = false;
    photoState.sourceHeight = 0;

    const base = new URL("assets/santa/", (typeof location !== "undefined" && location.href) || "file:///").href;

    return new Promise((resolve) => {
      if (typeof Image === "undefined") {
        photoState.missing = names.slice();
        resolve(photoReport());
        return;
      }
      names.forEach((pose) => {
        const img = new Image();
        img.onload = () => {
          if (!photoState.sourceHeight) photoState.sourceHeight = img.naturalHeight;
          photoState.images[pose] = img;
          done++;
          if (onProgress) onProgress(done / names.length, pose);
          if (done === names.length) {
            photoState.loaded = photoState.missing.length === 0;
            resolve(photoReport());
          }
        };
        img.onerror = () => {
          photoState.missing.push(pose);
          done++;
          if (onProgress) onProgress(done / names.length, pose);
          if (done === names.length) {
            photoState.loaded = photoState.missing.length === 0;
            resolve(photoReport());
          }
        };
        img.src = base + pose + ".png";
      });
    });
  }

  function photoReport() {
    return {
      loaded: photoState.loaded,
      required: REQUIRED_PHOTOS,
      present: REQUIRED_PHOTOS.filter((p) => photoState.images[p]),
      missing: photoState.missing.slice(),
      sourceHeight: photoState.sourceHeight,
    };
  }

  function build(poseName) {
    if (photoState.loaded && photoState.images[poseName]) {
      return [{ t: "santaImage", pose: poseName }];
    }
    if (photoState.loaded) {
      const fallback = REQUIRED_PHOTOS.find((p) => photoState.images[p]);
      if (fallback) return [{ t: "santaImage", pose: fallback }];
    }
    return buildVector(poseName);
  }

  function fillStyle(ctx, s, y0, y1) {
    if (!s.grad) return s.fill;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    if (s.grad === "suit") {
      g.addColorStop(0, "#e8524f");
      g.addColorStop(0.55, "#cf2f2f");
      g.addColorStop(1, "#9d1d1f");
      return g;
    }
    if (s.grad === "skin") {
      g.addColorStop(0, "#f7d0ab");
      g.addColorStop(1, "#d9a077");
      return g;
    }
    if (s.grad === "trim") {
      g.addColorStop(0, "#ffffff");
      g.addColorStop(1, "#d9d3c6");
      return g;
    }
    return s.fill;
  }

  function toCanvas(ctx, shapes, { x = 0, y = 0, scale = 1, flip = false } = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -scale : scale, scale);

    // Soft drop behind the figure so he grounds into the photo.
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = 8 / Math.max(scale, 0.01);
    ctx.shadowOffsetY = 2 / Math.max(scale, 0.01);
    ctx.fillStyle = "rgba(0,0,0,0.01)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (const s of shapes) {
      if (s.t === "santaImage") {
        const img = photoState.images[s.pose];
        if (!img) continue;
        const h = photoState.sourceHeight || img.naturalHeight;
        const w = img.naturalWidth;
        ctx.drawImage(img, -w / 2, -h, w, h);
        continue;
      }
      ctx.globalAlpha = s.opacity ? parseFloat(s.opacity) : 1;
      if (s.t === "circle") {
        ctx.beginPath();
        ctx.arc(s.cx, s.cy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = fillStyle(ctx, s, s.cy - s.r, s.cy + s.r);
        ctx.fill();
      } else if (s.t === "ellipse") {
        ctx.beginPath();
        ctx.ellipse(s.cx, s.cy, s.rx, s.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = fillStyle(ctx, s, s.cy - s.ry, s.cy + s.ry);
        ctx.fill();
      } else if (s.t === "rect") {
        const r = s.rx || 0;
        ctx.beginPath();
        if (r && ctx.roundRect) ctx.roundRect(s.x, s.y, s.w, s.h, r);
        else ctx.rect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = fillStyle(ctx, s, s.y, s.y + s.h);
        ctx.fill();
      } else if (s.t === "line") {
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.strokeStyle = s.stroke;
        ctx.lineWidth = s.sw;
        ctx.lineCap = s.cap || "round";
        ctx.stroke();
      } else if (s.t === "path") {
        const p = new Path2D(s.d);
        if (s.fill && s.fill !== "none") {
          ctx.fillStyle = fillStyle(ctx, s, -40, 20);
          ctx.fill(p);
        }
        if (s.stroke) {
          ctx.strokeStyle = s.stroke;
          ctx.lineWidth = s.sw || 1;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke(p);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  let gidSeq = 0;
  function toSVG(shapes, opts) {
    const o = opts || {};
    const x = o.x || 0, y = o.y || 0, flip = !!o.flip;
    const scale = o.scale === undefined ? 1 : o.scale;
    const gid = o.gid || ("sg" + (gidSeq++));
    const body = shapes.map((s) => {
      if (s.t === "santaImage") {
        const img = photoState.images[s.pose];
        if (!img) return "";
        const h = photoState.sourceHeight || img.naturalHeight;
        const w = img.naturalWidth;
        return `<image href="${img.src}" x="${-w / 2}" y="${-h}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
      }
      if (s.t === "circle")
        return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.fill}"${s.opacity ? ` opacity="${s.opacity}"` : ""}/>`;
      if (s.t === "ellipse")
        return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${s.fill}"${s.opacity ? ` opacity="${s.opacity}"` : ""}/>`;
      if (s.t === "rect")
        return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx || 0}" fill="${s.fill}"/>`;
      if (s.t === "line")
        return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${s.stroke}" stroke-width="${s.sw}" stroke-linecap="${s.cap || "round"}"/>`;
      if (s.t === "path") {
        const flat = s.fill && s.fill !== "none" ? s.fill : "none";
        const f = s.grad ? `url(#${gid}-${s.grad})` : flat;
        const stroke = s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.sw || 1}" stroke-linecap="round"` : "";
        return `<path d="${s.d}" fill="${f}"${stroke}${s.opacity ? ` opacity="${s.opacity}"` : ""}/>`;
      }
      return "";
    }).join("");
    const defs = `<defs>
      <linearGradient id="${gid}-suit" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#e8524f"/><stop offset="0.55" stop-color="#cf2f2f"/><stop offset="1" stop-color="#9d1d1f"/>
      </linearGradient>
      <linearGradient id="${gid}-skin" x1="0.3" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#f7d0ab"/><stop offset="1" stop-color="#d9a077"/>
      </linearGradient>
      <linearGradient id="${gid}-trim" x1="0.2" y1="0" x2="0.9" y2="1">
        <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9d3c6"/>
      </linearGradient>
    </defs>`;
    return defs + `<g transform="translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})">${body}</g>`;
  }

  function measureHeight() {
    const shapes = buildVector("stand");
    let min = 0, max = 0;
    for (const s of shapes) {
      if (s.t === "circle") {
        min = Math.min(min, s.cy - s.r);
        max = Math.max(max, s.cy + s.r);
      }
      if (s.t === "ellipse") {
        min = Math.min(min, s.cy - s.ry);
        max = Math.max(max, s.cy + s.ry);
      }
    }
    return Math.max(56, max - min);
  }

  const HEIGHT = measureHeight();

  // Kick off optional photo load in browsers; vector stays available immediately.
  if (typeof Image !== "undefined") {
    loadPhotos().catch(() => {});
  }

  global.Santa = {
    colors: C,
    poses: POSES,
    build,
    toSVG,
    toCanvas,
    loadPhotos,
    photoReport,
    get height() {
      if (photoState.loaded && photoState.sourceHeight) return photoState.sourceHeight;
      return HEIGHT;
    },
    get usingPhotos() { return photoState.loaded; },
  };
})(typeof window !== "undefined" ? window : globalThis);
