/* Scene engine — Santa placed into a user's own room photo.
 *
 * Anchors (door, sofa, table) come from the user. Santa walks the room and
 * sits on the SOFA only — never on the table. The table holds the treats;
 * seated poses stay at the sofa seat while arms reach toward the table.
 *
 * One character API: Scene.renderFrame(ctx, Santa, scene, time). Santa is
 * whatever global.Santa provides (vector art, or photo assets if present).
 */
(function (global) {
  "use strict";

  const D2R = Math.PI / 180;
  const SEATED = { sit: 1, reach: 1, eat: 1, drink: 1 };

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function buildTimeline() {
    // Body stays on sofa for sit / reach / eat / drink.
    // Table is a prop target, not a seat.
    return [
      { t: 0.00, at: "door",  pose: "wave",  label: "arrives" },
      { t: 0.12, at: "door",  pose: "wave" },
      { t: 0.18, at: "door",  pose: "stand" },
      { t: 0.40, at: "sofa",  pose: "walk",  label: "crosses the room" },
      { t: 0.48, at: "sofa",  pose: "sit",   label: "sits on the sofa" },
      { t: 0.58, at: "sofa",  pose: "reach", label: "reaches for the cookie" },
      { t: 0.70, at: "sofa",  pose: "eat",   label: "eats the cookie" },
      { t: 0.82, at: "sofa",  pose: "drink", label: "drinks the milk" },
      { t: 0.90, at: "sofa",  pose: "wave",  label: "happy goodbye" },
      { t: 0.94, at: "sofa",  pose: "stand" },
      { t: 1.00, at: "door",  pose: "wave",  label: "slips away" },
    ];
  }

  function beatAt(timeline, t) {
    let cur = timeline[0], next = timeline[1] || timeline[0];
    for (let i = 0; i < timeline.length - 1; i++) {
      if (t >= timeline[i].t && t <= timeline[i + 1].t) {
        cur = timeline[i];
        next = timeline[i + 1];
        break;
      }
    }
    return { cur, next };
  }

  /* Map an anchor name + pose to a floor/seat point in the room. */
  function anchorPoint(anchors, name, pose, size) {
    const pt = anchors[name];
    if (!pt) return { x: 0, y: 0 };
    if (name === "sofa") {
      if (SEATED[pose]) {
        // Sofa pin = seat cushion. Sit slightly into the seat, centered on pin.
        return { x: pt.x, y: pt.y + size * 0.06 };
      }
      // Standing by the sofa: feet on the floor below the seat.
      return { x: pt.x, y: pt.y + size * 0.32 };
    }
    // Door and table pins are floor / surface contact; Santa only stands at door.
    return { x: pt.x, y: pt.y };
  }

  function solve(anchors, t, timeline) {
    const tl = timeline || buildTimeline();
    const visits = [];
    let lastKey = null;
    for (const b of tl) {
      if (b.at !== lastKey) {
        visits.push({ at: b.at, t: b.t, pose: b.pose });
        lastKey = b.at;
      }
    }

    const tt = Math.max(0, Math.min(0.9999, t));
    let i = 0;
    while (i < visits.length - 1 && tt >= visits[i + 1].t) i++;
    const v0 = visits[i];
    const v1 = visits[Math.min(i + 1, visits.length - 1)];
    const span = Math.max(1e-6, v1.t - v0.t);
    const local = easeInOut(Math.max(0, Math.min(1, (tt - v0.t) / span)));

    const { cur } = beatAt(tl, tt);

    // Rough size first so seat→floor offset is stable while interpolating.
    const bottom = Math.max(anchors.door.y, anchors.sofa.y, anchors.table.y);
    const top = Math.min(anchors.door.y, anchors.sofa.y, anchors.table.y);
    const spread =
      Math.hypot(anchors.sofa.x - anchors.door.x, anchors.sofa.y - anchors.door.y) +
      Math.hypot(anchors.table.x - anchors.door.x, anchors.table.y - anchors.door.y);
    // Big enough to read as a visitor in the room, not a sticker in the corner.
    const base = Math.max(170, Math.min(spread * 0.62, 360));

    const from = anchorPoint(anchors, v0.at, v0.pose || "stand", base);
    const to = anchorPoint(anchors, v1.at, v1.pose || cur.pose, base);
    const x = from.x + (to.x - from.x) * local;
    const y = from.y + (to.y - from.y) * local;

    // Size from the sofa/door floor line so sitting (higher on screen) does not
    // shrink Santa as if he walked into the distance.
    const floorY = anchors.sofa.y + base * 0.30;
    const depth = (floorY - top) / Math.max(1, bottom - top);
    const size = base * (0.84 + 0.26 * Math.max(0, Math.min(1, depth)));

    // Face the table while seated so the reach reads as grabbing treats.
    let facing;
    if (SEATED[cur.pose] || cur.pose === "wave" && cur.at === "sofa") {
      facing = anchors.table.x >= anchors.sofa.x ? 1 : -1;
    } else {
      facing = x > (anchors.door.x + anchors.sofa.x) / 2 ? 1 : -1;
    }

    return { x, y, size, depth, facing, pose: cur.pose, seated: !!SEATED[cur.pose] };
  }

  function drawSnow(ctx, w, h, time, amount) {
    const N = amount;
    ctx.save();
    for (let i = 0; i < N; i++) {
      const s = Math.sin(i * 12.9898) * 43758.5453;
      const rx = s - Math.floor(s);
      const s2 = Math.sin(i * 78.233) * 12345.6789;
      const ry = s2 - Math.floor(s2);
      const sp = 0.5 + rx;
      const x = (rx * w + time * 14 * sp) % w;
      const y = (ry * h + time * 34 * sp) % h;
      const r = 0.8 + rx * 1.7;
      ctx.globalAlpha = 0.28 + rx * 0.40;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGlow(ctx, p, size) {
    const r = size * 0.55;
    const g = ctx.createRadialGradient(
      p.x, p.y - size * 0.45, r * 0.05,
      p.x, p.y - size * 0.45, r
    );
    g.addColorStop(0, "rgba(255,220,150,0.18)");
    g.addColorStop(0.55, "rgba(255,214,140,0.06)");
    g.addColorStop(1, "rgba(255,214,140,0)");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y - size * 0.45, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawContactShadow(ctx, p, size, light, seated) {
    const lx = (light && light.x) || -0.55;
    const ly = (light && light.y) || 0.35;
    // Seated: soft oval under the thighs on the cushion, not a separate “stool”.
    const off = size * (seated ? 0.04 : 0.14);
    const ry = seated ? 0.18 : 0.26;
    const rad = size * (seated ? 0.28 : 0.32);
    ctx.save();
    ctx.translate(p.x + lx * off, p.y + (seated ? size * 0.08 : ly * off * 0.4));
    ctx.scale(1.15, ry);
    const g = ctx.createRadialGradient(0, 0, size * 0.02, 0, 0, rad);
    g.addColorStop(0, seated ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.42)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* Milk + cookie on the table so the reach has something real to grab. */
  function drawTreats(ctx, table, size) {
    if (!table) return;
    const s = Math.max(14, size * 0.12);
    const x = table.x;
    const y = table.y;
    ctx.save();
    // Soft plate shadow
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2, s * 1.6, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Plate
    ctx.fillStyle = "#f4efe6";
    ctx.beginPath();
    ctx.ellipse(x, y, s * 1.55, s * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(120,100,80,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Cookie
    ctx.fillStyle = "#d9a15b";
    ctx.beginPath();
    ctx.arc(x - s * 0.35, y - s * 0.15, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b4423";
    [[-0.5, -0.35], [0.15, -0.05], [-0.1, 0.25]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(x - s * 0.35 + dx * s * 0.4, y - s * 0.15 + dy * s * 0.4, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    });
    // Milk glass
    const gx = x + s * 0.55;
    const gy = y - s * 0.55;
    ctx.fillStyle = "rgba(220,235,240,0.85)";
    ctx.beginPath();
    ctx.moveTo(gx - s * 0.28, gy - s * 0.55);
    ctx.lineTo(gx + s * 0.28, gy - s * 0.55);
    ctx.lineTo(gx + s * 0.22, gy + s * 0.55);
    ctx.lineTo(gx - s * 0.22, gy + s * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(gx - s * 0.20, gy - s * 0.1);
    ctx.lineTo(gx + s * 0.20, gy - s * 0.1);
    ctx.lineTo(gx + s * 0.16, gy + s * 0.48);
    ctx.lineTo(gx - s * 0.16, gy + s * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(100,130,140,0.55)";
    ctx.stroke();
    ctx.restore();
  }

  function sampleRoomColour(ctx, w, h) {
    try {
      const d = ctx.getImageData(
        Math.floor(w * 0.2), Math.floor(h * 0.82),
        Math.max(1, Math.floor(w * 0.6)), 8
      ).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
      }
      if (!n) return { r: 1, g: 1, b: 1 };
      return { r: (r / n) / 128, g: (g / n) / 128, b: (b / n) / 128 };
    } catch (e) {
      return { r: 1, g: 1, b: 1 };
    }
  }

  /* Sample sofa fabric *before* Santa is drawn so we never pick beard/suit pixels. */
  function sampleSeatColour(ctx, anchors) {
    let r = 63, g = 90, b = 82;
    if (!anchors || !anchors.sofa) return { r, g, b };
    try {
      const sx = Math.max(0, Math.min(ctx.canvas.width - 4, (anchors.sofa.x - 10) | 0));
      const sy = Math.max(0, Math.min(ctx.canvas.height - 4, (anchors.sofa.y - 12) | 0));
      const d = ctx.getImageData(sx, sy, 4, 4).data;
      r = d[0]; g = d[1]; b = d[2];
    } catch (e) { /* keep default */ }
    return { r, g, b };
  }

  /* Thin cushion lip over the hips only — embeds Santa in the seat. */
  function drawSeatOcclusion(ctx, p, seatColour) {
    if (!p.seated || !seatColour) return;
    const { r, g, b } = seatColour;
    ctx.save();
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.size * 0.06, p.size * 0.22, p.size * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* Draw Santa onto an offscreen canvas, grade him into the room, then blit. */
  function drawSantaGraded(ctx, Santa, shapes, p, scale, tint, matchLight) {
    const pad = Math.ceil(p.size * 1.2);
    const ow = pad * 2;
    const oh = pad * 2;
    const off = document.createElement("canvas");
    off.width = ow;
    off.height = oh;
    const octx = off.getContext("2d");
    // Slight seated squash = weight on the cushion.
    const sy = p.seated ? 0.94 : 1;
    octx.save();
    octx.translate(pad, pad);
    octx.scale(1, sy);
    Santa.toCanvas(octx, shapes, {
      x: 0, y: 0, scale, flip: p.facing < 0,
    });
    octx.restore();

    if (matchLight && tint) {
      octx.save();
      octx.globalCompositeOperation = "source-atop";
      octx.globalAlpha = 0.26;
      const warm = Math.max(0.85, Math.min(1.25, tint.r));
      const cool = Math.max(0.85, Math.min(1.2, tint.b));
      octx.fillStyle = `rgb(${Math.round(210 * warm)},${Math.round(170 * ((tint.g + warm) / 2))},${Math.round(140 * cool)})`;
      octx.fillRect(0, 0, ow, oh);
      octx.restore();
      // Gentle multiply so reds share the room's colour world.
      octx.save();
      octx.globalCompositeOperation = "multiply";
      octx.globalAlpha = 0.12;
      octx.fillStyle = `rgb(${Math.round(180 * tint.r)},${Math.round(170 * tint.g)},${Math.round(160 * tint.b)})`;
      octx.fillRect(0, 0, ow, oh);
      octx.restore();
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = 0.98;
    ctx.drawImage(off, p.x - pad, p.y - pad);
    ctx.restore();
  }

  function renderFrame(ctx, Santa, scene, timeSeconds) {
    const { w, h, anchors, photo } = scene;
    const DURATION = scene.duration || 11;
    const t = Math.max(0, Math.min(1, timeSeconds / DURATION));
    const matchLight = scene.matchLight !== false;

    ctx.clearRect(0, 0, w, h);
    if (photo) ctx.drawImage(photo, 0, 0, w, h);

    if (!anchors || !anchors.door || !anchors.sofa || !anchors.table) {
      drawSnow(ctx, w, h, timeSeconds, 26);
      return;
    }

    const timeline = buildTimeline();
    const p = solve(anchors, t, timeline);
    const { cur } = beatAt(timeline, t);
    const scale = p.size / Santa.height;

    if (matchLight && scene.tint) {
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = `rgb(${scene.tint.r * 128 | 0},${scene.tint.g * 128 | 0},${scene.tint.b * 128 | 0})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    const seatColour = sampleSeatColour(ctx, anchors);

    drawTreats(ctx, anchors.table, p.size);
    drawGlow(ctx, p, p.size);
    drawSnow(ctx, w, h, timeSeconds, 18);
    drawContactShadow(ctx, p, p.size, scene.light, p.seated);

    const shapes = Santa.build(cur.pose);
    drawSantaGraded(ctx, Santa, shapes, p, scale, scene.tint, matchLight);
    // Seat occlusion disabled: a drawn cushion oval read as a second table.
    // Weight comes from sink + contact shadow + colour grade instead.
  }

  global.Scene = {
    D2R, buildTimeline, solve, renderFrame,
    drawSnow, drawGlow, drawContactShadow, sampleRoomColour, drawTreats,
  };
})(typeof window !== "undefined" ? window : globalThis);
