(function () {
  'use strict';
  const B = '#f7f6f2', INK = '#28313a', GRAY = '#7d8891', LIGHT = '#d4dcda';
  const TEAL = '#087f73', CORAL = '#bf604e', TAU = Math.PI * 2;
  const rad = degrees => degrees * Math.PI / 180;
  const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.5));

  function line(c, a, b, color = INK, width = 3, dash = []) {
    c.save(); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'butt'; c.setLineDash(dash); c.stroke(); c.restore();
  }
  function path(c, points, color = INK, width = 3, close = false, fill = null) {
    c.save(); c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
    if (close) c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (color) { c.strokeStyle = color; c.lineWidth = width; c.lineJoin = 'round'; c.stroke(); }
    c.restore();
  }
  function circle(c, x, y, r, fill = null, stroke = INK, width = 3) {
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
    c.restore();
  }
  function text(c, words, x, y, size = 20, color = INK, align = 'center') {
    c.save(); c.font = `500 ${Math.max(18, size)}px system-ui, -apple-system, "Noto Sans JP", sans-serif`;
    c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(words, x, y); c.restore();
  }
  function arrow(c, a, b, color = INK, width = 2.5, tip = 9) {
    line(c, a, b, color, width);
    const theta = Math.atan2(b[1] - a[1], b[0] - a[0]);
    line(c, b, [b[0] - tip * Math.cos(theta - 0.5), b[1] - tip * Math.sin(theta - 0.5)], color, width);
    line(c, b, [b[0] - tip * Math.cos(theta + 0.5), b[1] - tip * Math.sin(theta + 0.5)], color, width);
  }
  function measure(c, a, b, label, labelAt, color = TEAL) {
    line(c, a, b, color, 2);
    const theta = Math.atan2(b[1] - a[1], b[0] - a[0]), dx = 6 * Math.sin(theta), dy = 6 * Math.cos(theta);
    [a, b].forEach(p => line(c, [p[0] - dx, p[1] + dy], [p[0] + dx, p[1] - dy], color, 2));
    if (label) text(c, label, labelAt[0], labelAt[1], 18, color);
  }
  function wrap(draw) {
    return function (ctx, state) {
      const s = Object.assign({ reveal: false, running: false, time: 0, value: 0.5, variant: 0, seed: 0 }, state || {});
      s.value = clamp(s.value); s.time = Math.max(0, Number(s.time) || 0);
      ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.setLineDash([]); ctx.fillStyle = B; ctx.fillRect(0, 0, 640, 400);
      try { draw(ctx, s); } finally { ctx.restore(); }
    };
  }
  function endpointGuides(c, x1, x2, top, bottom) {
    line(c, [x1, top], [x1, bottom], TEAL, 1.5, [5, 5]);
    line(c, [x2, top], [x2, bottom], TEAL, 1.5, [5, 5]);
  }

  const renderers = {};

  renderers.G01 = wrap((c, s) => {
    const x1 = 190, x2 = 450, wing = 24 + 42 * s.value;
    [130, 270].forEach((y, i) => {
      line(c, [x1, y], [x2, y], INK, 5);
      if (!s.reveal) {
        const sign = i === 0 ? 1 : -1;
        [-1, 1].forEach(dy => {
          line(c, [x1, y], [x1 + sign * wing, y + dy * wing], INK, 3.5);
          line(c, [x2, y], [x2 - sign * wing, y + dy * wing], INK, 3.5);
        });
      }
    });
    text(c, 'A', 105, 130); text(c, 'B', 105, 270);
    if (s.reveal) {
      endpointGuides(c, x1, x2, 95, 305);
      measure(c, [x1, 335], [x2, 335], '260 = 260', [320, 365]);
    }
  });

  renderers.G02 = wrap((c, s) => {
    if (!s.reveal) {
      const topHalf = (170 - 120 * s.value) / 2;
      [-1, 1].forEach(sign => line(c, [320 + sign * topHalf, 55], [320 + sign * 205, 340], GRAY, 3));
      for (let i = 1; i <= 7; i++) {
        const t = (i / 8) ** 1.6, y = 55 + 285 * t, half = topHalf + (205 - topHalf) * t;
        line(c, [320 - half, y], [320 + half, y], '#a8b0b2', 2);
      }
    }
    [125, 270].forEach(y => line(c, [240, y], [400, y], INK, 9));
    if (s.reveal) {
      endpointGuides(c, 240, 400, 95, 300);
      measure(c, [240, 335], [400, 335], '160 = 160', [320, 365]);
    }
  });

  renderers.G03 = wrap((c, s) => {
    if (!s.reveal) {
      [[180, 7, 93, 37], [460, 8, 61, 13]].forEach(([x, n, orbit, r]) => {
        for (let i = 0; i < n; i++) {
          const a = TAU * i / n + (n === 7 ? Math.PI / 2 : 0);
          circle(c, x + orbit * Math.cos(a), 195 + orbit * Math.sin(a), r, LIGHT, INK, 2);
        }
      });
    }
    [180, 460].forEach(x => {
      circle(c, x, 195, 25, INK, null);
      if (s.reveal) {
        line(c, [x - 25, 195], [x - 25, 270], TEAL, 1, [4, 4]);
        line(c, [x + 25, 195], [x + 25, 270], TEAL, 1, [4, 4]);
        measure(c, [x - 25, 265], [x + 25, 265], '直径50', [x, 300]);
      }
    });
    text(c, 'A', 180, 350); text(c, 'B', 460, 350);
  });

  renderers.G04 = wrap((c, s) => {
    const outer = [44, 70 + 55 * s.value];
    [175, 465].forEach((x, i) => {
      if (!s.reveal) circle(c, x, 195, outer[(i + (s.variant % 2)) % 2], null, INK, 3);
      circle(c, x, 195, 34, INK, null);
      if (s.reveal) {
        measure(c, [x - 34, 265], [x + 34, 265], '直径68', [x, 300]);
        line(c, [x - 34, 195], [x - 34, 270], TEAL, 1, [4, 4]);
        line(c, [x + 34, 195], [x + 34, 270], TEAL, 1, [4, 4]);
      }
    });
    text(c, 'A', 175, 350); text(c, 'B', 465, 350);
  });

  function annularSector(c, x, y, fill, stroke = INK, width = 3, dash = []) {
    c.save(); c.beginPath(); c.arc(x, y, 270, rad(-130), rad(-50));
    c.arc(x, y, 218, rad(-50), rad(-130), true); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    c.strokeStyle = stroke; c.lineWidth = width; c.setLineDash(dash); c.stroke(); c.restore();
  }
  renderers.G05 = wrap((c, s) => {
    if (!s.reveal) {
      annularSector(c, 330, 360, '#c8d0ce');
      annularSector(c, 297, 460, '#c8d0ce');
      text(c, 'A', 100, 135); text(c, 'B', 100, 270);
    } else {
      annularSector(c, 320, 420, '#e3e9e4', TEAL, 6);
      annularSector(c, 320, 420, null, CORAL, 2.5, [8, 5]);
      text(c, '2つの帯を同じ位置に重ねる', 320, 65, 22);
      text(c, '外側の弧も、内側の弧も一致', 320, 340, 20, TEAL);
    }
  });

  renderers.G06 = wrap((c, s) => {
    if (!s.reveal) {
      line(c, [210, 300], [430, 300], INK, 5);
      line(c, [320, 80], [320, 300], INK, 5);
      text(c, '縦', 360, 170); text(c, '横', 320, 345);
    } else {
      line(c, [210, 140], [430, 140], CORAL, 5);
      line(c, [210, 260], [430, 260], INK, 5);
      endpointGuides(c, 210, 430, 110, 290);
      text(c, '元の縦', 115, 140); text(c, '元の横', 115, 260);
      measure(c, [210, 325], [430, 325], '220 = 220', [320, 360]);
    }
  });

  renderers.G07 = wrap((c, s) => {
    const n = 3 + Math.round(14 * s.value);
    if (!s.reveal) for (let i = 1; i <= n; i++) {
      const x = 100 + 220 * i / (n + 1); line(c, [x, 177], [x, 223], INK, 2.5);
    }
    [100, 320, 540].forEach((x, i) => {
      line(c, [x, 162], [x, 238], INK, 4);
      text(c, ['A', 'B', 'C'][i], x, 275);
    });
    if (s.reveal) {
      measure(c, [100, 320], [320, 320], '220', [210, 350]);
      measure(c, [320, 320], [540, 320], '220', [430, 350]);
    }
  });

  renderers.G08 = wrap((c, s) => {
    if (!s.reveal) {
      path(c, [[70, 100], [430, 100], [510, 280], [150, 280]], GRAY, 3, true);
      line(c, [330, 100], [410, 280], GRAY, 3);
      line(c, [150, 280], [330, 100], INK, 6);
      line(c, [330, 100], [510, 280], INK, 6);
      text(c, 'A', 220, 330); text(c, 'B', 440, 330);
    } else {
      const half = 90 * Math.SQRT2;
      line(c, [320 - half, 140], [320 + half, 140], INK, 5);
      line(c, [320 - half, 260], [320 + half, 260], CORAL, 5);
      endpointGuides(c, 320 - half, 320 + half, 110, 290);
      text(c, 'A', 115, 140); text(c, 'B', 115, 260);
      text(c, '回転して並べると、両端が一致', 320, 350, 20, TEAL);
    }
  });

  renderers.G09 = wrap((c, s) => {
    const w = 80 + 100 * s.value;
    line(c, [120, 310], [520, 90], INK, 5);
    c.save(); c.globalAlpha = s.reveal ? 0.12 : 1;
    c.fillStyle = '#c5cdcb'; c.fillRect(320 - w / 2, 55, w, 290);
    c.strokeStyle = GRAY; c.lineWidth = 2; c.strokeRect(320 - w / 2, 55, w, 290); c.restore();
    if (s.reveal) {
      line(c, [120, 310], [520, 90], TEAL, 3);
      circle(c, 120, 310, 5, TEAL, null); circle(c, 520, 90, 5, TEAL, null);
      text(c, '隠れていた部分も同じ直線', 320, 375, 20, TEAL);
    }
  });

  renderers.G10 = wrap((c, s) => {
    for (let i = 0; i < 5; i++) {
      const x = 80 + 100 * i;
      line(c, [x, 310], [x + 100, 90], INK, 4);
      if (!s.reveal) for (let j = 1; j <= 8; j++) {
        const t = j / 9, px = x + 100 * t, py = 310 - 220 * t;
        const d = i % 2 ? [0, 23] : [23, 0];
        line(c, [px - d[0], py - d[1]], [px + d[0], py + d[1]], INK, 2.5);
      }
    }
    if (s.reveal) {
      line(c, [60, 310], [500, 310], TEAL, 1.5, [5, 5]);
      line(c, [160, 90], [600, 90], TEAL, 1.5, [5, 5]);
      text(c, '同じ傾きの線を等間隔に移動', 320, 365, 20, TEAL);
    }
  });

  function heringTargets(c, reveal) {
    [230, 410].forEach(x => line(c, [x, 65], [x, 335], INK, 5));
    if (reveal) {
      measure(c, [230, 95], [410, 95], '180', [320, 70]);
      measure(c, [230, 305], [410, 305], '180', [320, 335]);
      text(c, '直線・同じ間隔', 320, 375, 20, TEAL);
    }
  }
  renderers.G11 = wrap((c, s) => {
    if (!s.reveal) {
      c.save(); c.beginPath(); c.rect(45, 45, 550, 310); c.clip();
      for (let i = 0; i < 18; i++) {
        const a = i * Math.PI / 18, dx = 650 * Math.cos(a), dy = 650 * Math.sin(a);
        line(c, [320 - dx, 200 - dy], [320 + dx, 200 + dy], '#969fa4', 1.6);
      }
      c.restore();
    }
    heringTargets(c, s.reveal);
  });
  renderers.G12 = wrap((c, s) => {
    if (!s.reveal) for (let y = 25; y <= 375; y += 25) {
      path(c, [[70, 200], [320, y], [570, 200]], '#969fa4', 1.6);
    }
    heringTargets(c, s.reveal);
  });

  renderers.G13 = wrap((c, s) => {
    if (!s.reveal) {
      c.save(); c.beginPath(); c.rect(50, 50, 540, 300); c.clip();
      for (let i = 0; i <= 24; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 48;
        line(c, [100, 315], [100 + Math.cos(a) * 900, 315 + Math.sin(a) * 900], '#9aa3a6', 1.6);
      }
      c.restore();
    }
    path(c, [[265, 110], [455, 110], [455, 300], [265, 300]], INK, 5, true);
    if (s.reveal) {
      [[265, 110, 1, 1], [455, 110, -1, 1], [455, 300, -1, -1], [265, 300, 1, -1]].forEach(([x, y, a, b]) =>
        path(c, [[x + 14 * a, y], [x + 14 * a, y + 14 * b], [x, y + 14 * b]], TEAL, 2));
      measure(c, [265, 335], [455, 335], '190', [360, 365]);
      measure(c, [225, 110], [225, 300], '190', [185, 205]);
    }
  });

  renderers.G14 = wrap((c, s) => {
    const tile = 48, gap = 3, top = 32, left = 48, right = 592;
    // The animation changes only row offsets; every mortar y coordinate is fixed.
    const shift = tile * (s.value + 0.5 * Math.sin(s.time * 0.8));
    if (!s.reveal) {
      c.save(); c.beginPath(); c.rect(left, top, right - left, 306); c.clip();
      c.fillStyle = '#8d9496'; c.fillRect(left, top, right - left, 306);
      for (let row = 0; row < 6; row++) for (let col = -3; col < 15; col++) {
        const x = left + col * tile + (row % 2 ? shift : 0);
        c.fillStyle = col % 2 === 0 ? '#f9faf6' : '#30383c';
        c.fillRect(x, top + row * (tile + gap), tile, tile);
      }
      c.restore();
      if (!s.running) {
        // Static reference frames for the two useful phases of the periodic motion.
        [0, 0.5].forEach((offset, i) => {
          const px = i ? 400 : 165, py = 347, small = 12;
          c.save(); c.beginPath(); c.rect(px, py, 72, 25); c.clip();
          c.fillStyle = '#8d9496'; c.fillRect(px, py, 72, 25);
          for (let row = 0; row < 2; row++) for (let col = -1; col < 7; col++) {
            c.fillStyle = col % 2 === 0 ? '#f9faf6' : '#30383c';
            c.fillRect(px + col * small + (row ? offset * small : 0), py + row * 13, small, small);
          }
          c.restore(); text(c, i ? '半枚のずれ' : '整列', px + 36, 389, 18, GRAY);
        });
      }
    } else {
      for (let row = 0; row < 5; row++) {
        const y = top + tile + gap / 2 + row * (tile + gap);
        line(c, [left, y], [right, y], TEAL, 3);
      }
      text(c, '横の目地だけを残すと、すべて水平', 320, 380, 18, TEAL);
    }
  });

  renderers.G15 = wrap((c, s) => {
    const cx = 320, cy = 195, radii = [30, 55, 80, 105, 130, 155];
    if (!s.reveal) {
      c.save(); c.beginPath(); c.arc(cx, cy, 169, 0, TAU); c.clip();
      for (let row = -9; row <= 9; row++) for (let col = -9; col <= 9; col++) {
        c.fillStyle = (row + col) % 2 ? '#e2e5df' : '#f7f6f2';
        c.fillRect(cx + col * 20, cy + row * 20, 20, 20);
      }
      c.restore();
      radii.forEach(r => {
        c.save(); c.beginPath(); c.arc(cx, cy, r + 6, 0, TAU); c.arc(cx, cy, r - 6, 0, TAU, true); c.clip('evenodd');
        c.fillStyle = '#29323a'; c.fillRect(cx - r - 8, cy - r - 8, 2 * r + 16, 2 * r + 16);
        const n = Math.max(12, Math.round(TAU * r / 16)), tilt = 0.14 + 0.48 * s.value;
        for (let i = 0; i < n; i++) {
          const a = TAU * i / n;
          c.save(); c.translate(cx + r * Math.cos(a), cy + r * Math.sin(a)); c.rotate(a + Math.PI / 2 + tilt);
          c.fillStyle = '#f7f6f2'; c.fillRect(-4, -18, 8, 36); c.restore();
        }
        c.restore();
      });
    } else {
      radii.forEach(r => circle(c, cx, cy, r, null, TEAL, 3));
      circle(c, cx, cy, 3.5, CORAL, null);
      text(c, 'すべて閉じた同心円', 320, 380, 20, TEAL);
    }
  });

  function grating(c, x, y, radius, angle, spacing, width, color) {
    c.save(); c.beginPath(); c.arc(x, y, radius, 0, TAU); c.clip();
    c.fillStyle = B; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    c.translate(x, y); c.rotate(angle);
    for (let q = -radius * 2; q <= radius * 2; q += spacing) line(c, [q, -radius * 2], [q, radius * 2], color, width);
    c.restore();
  }
  renderers.G16 = wrap((c, s) => {
    const angle = rad(5 + 30 * s.value);
    [170, 470].forEach((x, i) => {
      if (!s.reveal) grating(c, x, 195, 125, (i ? -1 : 1) * angle, 12, 4, '#65717a');
      circle(c, x, 195, 66, B, null);
      grating(c, x, 195, 60, 0, 10, 3.5, INK);
      if (s.reveal) line(c, [x, 105], [x, 285], TEAL, 2, [6, 5]);
      text(c, i ? 'B' : 'A', x, 350);
    });
  });

  const tableShape = [[-110, -45], [50, -45], [110, 45], [-50, 45]];
  function transformedTable(x, y, angle) {
    const ca = Math.cos(angle), sa = Math.sin(angle);
    return tableShape.map(([px, py]) => [x + px * ca - py * sa, y + px * sa + py * ca]);
  }
  function table(c, points, context) {
    if (context) {
      points.forEach(p => path(c, [[p[0] - 4, p[1]], [p[0] + 4, p[1]], [p[0] + 4, p[1] + 70], [p[0] - 4, p[1] + 70]], INK, 1.5, true, '#aeb9b4'));
      path(c, points.map(p => [p[0], p[1] + 9]), INK, 2, true, '#adb9b3');
    }
    path(c, points, INK, 2.5, true, '#d5dcd6');
  }
  renderers.G17 = wrap((c, s) => {
    const left = transformedTable(180, 185, rad(-70)), right = transformedTable(460, 170, 0);
    table(c, left, !s.reveal); table(c, right, !s.reveal);
    let t = (s.time % 8) / 8; t = t <= 0.5 ? 2 * t : 2 - 2 * t; t = t * t * (3 - 2 * t);
    if (s.reveal) t = 1;
    const moving = transformedTable(180 + 280 * t, 185 - 15 * t, rad(-70) * (1 - t));
    if (s.reveal || s.time > 0) {
      c.save(); c.globalAlpha = 0.16; path(c, moving, null, 0, true, TEAL); c.restore();
      path(c, moving, TEAL, 4.5, true);
    }
    if (!s.running && !s.reveal) {
      // Both drawn tabletops are the exact start and end outlines of the moving panel.
      text(c, '再生すると左の天板が回転して右に重なる', 320, 378, 18, GRAY);
    }
    if (s.reveal) text(c, '回転・移動だけで輪郭が一致', 320, 360, 20, TEAL);
  });

  function person(c, x, bottom, height, color = INK) {
    const r = height * 0.09;
    circle(c, x, bottom - height + r, r, color, null);
    line(c, [x, bottom - height + r * 2.4], [x, bottom - height * 0.36], color, Math.max(3, height * 0.045));
    line(c, [x - height * 0.18, bottom - height * 0.62], [x + height * 0.18, bottom - height * 0.62], color, Math.max(3, height * 0.035));
    line(c, [x, bottom - height * 0.36], [x - height * 0.13, bottom], color, Math.max(3, height * 0.04));
    line(c, [x, bottom - height * 0.36], [x + height * 0.13, bottom], color, Math.max(3, height * 0.04));
  }
  renderers.G18 = wrap((c, s) => {
    if (!s.reveal) {
      text(c, '固定視点からの見え（模式図）', 320, 28, 20);
      const inner = [[160, 80], [480, 80], [480, 300], [160, 300]];
      const outer = [[70, 50], [570, 50], [570, 345], [70, 345]];
      path(c, outer, GRAY, 2, true, '#eef0e9'); path(c, inner, GRAY, 2, true, '#e2e6df');
      inner.forEach((p, i) => line(c, p, outer[i], GRAY, 2));
      person(c, 205, 299, 82); person(c, 435, 299, 164);
      text(c, '同じ身長でも、写る高さは違う', 320, 377, 18, GRAY);
    } else {
      text(c, '上から見た配置（模式図）', 320, 28, 20);
      path(c, [[110, 80], [500, 225], [510, 315], [200, 315]], GRAY, 2.5, true, '#e3e8e2');
      const eye = [320, 358], far = [150, 105], near = [465, 220];
      line(c, eye, far, TEAL, 2, [6, 5]); line(c, eye, near, CORAL, 2, [6, 5]);
      circle(c, far[0], far[1], 9, TEAL, null); circle(c, near[0], near[1], 9, CORAL, null);
      circle(c, eye[0], eye[1], 7, INK, null);
      text(c, '遠い側', 155, 60, 19, TEAL); text(c, '近い側', 525, 185, 19, CORAL);
      text(c, '固定視点', 320, 386, 18); text(c, '人物の身長は同じ', 320, 147, 19);
    }
  });

  renderers.G19 = wrap((c, s) => {
    if (!s.reveal) {
      text(c, 'カメラに写る像（模式図）', 320, 45, 21);
      [185, 455].forEach(x => {
        c.save(); c.fillStyle = '#e4e8e1'; c.fillRect(x - 100, 95, 200, 220); c.restore();
        circle(c, x, 195, 56, '#a7b5af', INK, 3);
      });
      text(c, '同じ見かけでも、大きさと距離は別', 320, 355, 20);
    } else {
      text(c, '高さと距離を同じ比率で変える', 320, 35, 20);
      const eye = [90, 235];
      line(c, eye, [410, 135], GRAY, 2); line(c, eye, [410, 335], GRAY, 2);
      line(c, [250, 185], [250, 285], TEAL, 8);
      line(c, [410, 135], [410, 335], CORAL, 8);
      circle(c, eye[0], eye[1], 7, INK, null);
      text(c, '視点', 90, 275, 18); text(c, '高さ100', 265, 150, 18, TEAL); text(c, '高さ200', 465, 110, 18, CORAL);
      measure(c, [90, 365], [250, 365], '距離160', [170, 390], TEAL);
      measure(c, [250, 365], [410, 365], '+160', [330, 390], CORAL);
      text(c, '同じ2本の視線に収まる', 420, 75, 19);
    }
  });

  function key(c) {
    c.save(); c.fillStyle = INK; c.beginPath(); c.arc(-36, 0, 26, 0, TAU); c.arc(-36, 0, 12, 0, TAU, true); c.fill('evenodd');
    c.fillRect(-10, -7, 75, 14); c.fillRect(38, 5, 11, 21); c.fillRect(54, 5, 11, 30); c.restore();
  }
  renderers.G20 = wrap((c, s) => {
    const horizontal = s.reveal ? 1 : 2.8 - 1.8 * s.value;
    text(c, '投影の補正を、横伸縮で説明', 320, 50, 20);
    c.save(); c.translate(320, 185); c.scale(1.5 * horizontal, 1.5); key(c); c.restore();
    arrow(c, [180, 300], [260, 300], s.reveal ? TEAL : GRAY);
    arrow(c, [460, 300], [380, 300], s.reveal ? TEAL : GRAY);
    text(c, s.reveal ? '同じ経路を元の横倍率へ戻す' : '補正を動かして形を確かめる', 320, 355, 20, s.reveal ? TEAL : INK);
  });

  renderers.G21 = wrap((c, s) => {
    if (!s.reveal) {
      text(c, '等しい円による模式図', 320, 30, 20);
      path(c, [[0, 315], [80, 297], [140, 316], [220, 292], [280, 310], [340, 272], [380, 297], [430, 304], [485, 295], [550, 265], [640, 296], [640, 400], [0, 400]], null, 0, true, '#bcc7bf');
      path(c, [[336, 300], [336, 263], [354, 247], [372, 263], [372, 300]], GRAY, 2, true, '#e2e7de');
      line(c, [0, 304], [640, 304], GRAY, 1.5);
      circle(c, 180, 105, 28, B, INK, 2);
      circle(c, 460, 270, 28, B, INK, 2);
    } else {
      [180, 460].forEach(x => {
        circle(c, x, 190, 28, B, INK, 2);
        measure(c, [x - 28, 260], [x + 28, 260], '直径56', [x, 295]);
      });
      text(c, '背景を消して、同じ高さで比較', 320, 355, 20, TEAL);
    }
  });

  renderers.G22 = wrap((c, s) => {
    if (!s.reveal) {
      text(c, '凹面マスクの正面図（模式）', 320, 32, 20);
      c.save(); c.beginPath(); c.ellipse(320, 195, 92, 128, 0, 0, TAU);
      const shade = c.createLinearGradient(228, 195, 412, 195); shade.addColorStop(0, '#abb7b2'); shade.addColorStop(0.55, '#eef0e8'); shade.addColorStop(1, '#c4cec7');
      c.fillStyle = shade; c.fill(); c.strokeStyle = GRAY; c.lineWidth = 2; c.stroke();
      [[286, 175], [354, 175]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 15, 7, 0, 0, TAU); c.fillStyle = '#73817b'; c.fill(); });
      path(c, [[320, 173], [306, 222], [329, 222]], '#97a39b', 4);
      c.beginPath(); c.moveTo(287, 259); c.quadraticCurveTo(320, 273, 353, 259); c.strokeStyle = '#78867e'; c.lineWidth = 4; c.stroke(); c.restore();
      text(c, '正面の絵だけでは、凹凸を一意に決めにくい', 320, 370, 18, GRAY);
    } else {
      text(c, '物体：凹面', 200, 42, 21, TEAL); text(c, '解釈の候補：凸面', 440, 42, 21, CORAL);
      line(c, [170, 85], [170, 310], GRAY, 1.5, [5, 5]); line(c, [470, 85], [470, 310], GRAY, 1.5, [5, 5]);
      const concave = [[170, 95], [184, 135], [188, 173], [235, 197], [188, 219], [184, 260], [170, 300]];
      const convex = concave.map(([x, y]) => [640 - x, y]);
      path(c, concave, TEAL, 5); path(c, convex, CORAL, 5);
      arrow(c, [75, 197], [145, 197], INK); arrow(c, [330, 197], [390, 197], INK);
      text(c, 'へこむ', 210, 338, 19, TEAL); text(c, '手前へ出る', 440, 338, 19, CORAL);
      text(c, '顔の断面を横から見た説明図', 320, 380, 18);
    }
  });

  // A three-prism open sculpture. Its endpoints differ by (1,1,1), which
  // projects to zero at the first view. The reveal uses another linear projection.
  function tribar(c, reveal) {
    const w = 0.06, size = 285;
    function project(p) {
      const depth = p[0] + p[1] + p[2] - 1.5;
      return [320 + size * (0.5 * p[0] - p[1] + 0.5 * p[2]) + (reveal ? 38 * depth : 0),
        65 + size * Math.sqrt(3) / 2 * (p[0] - p[2]) - (reveal ? 14 * depth : 0)];
    }
    const boxes = [
      [[0, 1], [-w, w], [-w, w]],
      [[1 - w, 1 + w], [0, 1], [-w, w]],
      [[1 - w, 1 + w], [1 - w, 1 + w], [0, 1]]
    ];
    const faces = [];
    boxes.forEach(bounds => {
      for (let axis = 0; axis < 3; axis++) {
        const other = [0, 1, 2].filter(a => a !== axis), points = [];
        [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(bits => {
          const p = [0, 0, 0]; p[axis] = bounds[axis][1];
          p[other[0]] = bounds[other[0]][bits[0]]; p[other[1]] = bounds[other[1]][bits[1]]; points.push(p);
        });
        faces.push({ points, depth: points.reduce((sum, p) => sum + p[0] + p[1] + p[2], 0) / 4, axis });
      }
    });
    faces.sort((a, b) => a.depth - b.depth).forEach(f => path(c, f.points.map(project), INK, 1.6, true, ['#b9c5be', '#e0e7de', '#87998c'][f.axis]));
    if (reveal) {
      const start = project([0, 0, 0]), end = project([1, 1, 1]);
      line(c, start, end, CORAL, 2, [5, 5]);
      circle(c, start[0], start[1], 6, TEAL, null); circle(c, end[0], end[1], 6, CORAL, null);
    }
  }
  renderers.G23 = wrap((c, s) => {
    tribar(c, s.reveal);
    text(c, s.reveal ? '視点をずらすと、重なった端が離れる' : '3つの接合部を順にたどる', 320, 377, 18, s.reveal ? TEAL : GRAY);
  });

  renderers.G24 = wrap((c, s) => {
    if (!s.reveal) {
      text(c, '不可能な接続を考える模式図', 320, 30, 20);
      const vertices = [[320, 85], [535, 190], [320, 295], [105, 190]];
      for (let k = 0; k < 4; k++) {
        const a = vertices[k], b = vertices[(k + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
        const nx = -dy / length * 21, ny = dx / length * 21;
        for (let j = 0; j < 3; j++) {
          const p = [a[0] + dx * j / 3, a[1] + dy * j / 3], q = [a[0] + dx * (j + 1) / 3, a[1] + dy * (j + 1) / 3];
          const p1 = [p[0] - nx, p[1] - ny], p2 = [p[0] + nx, p[1] + ny], q1 = [q[0] - nx, q[1] - ny], q2 = [q[0] + nx, q[1] + ny];
          path(c, [q1, q2, [q2[0], q2[1] + 10], [q1[0], q1[1] + 10]], INK, 1.2, true, '#85978c');
          path(c, [p1, q1, q2, p2], INK, 1.6, true, j % 2 ? '#d4dfd3' : '#e5ebe1');
        }
        arrow(c, [a[0] + dx * 0.35, a[1] + dy * 0.35], [a[0] + dx * 0.65, a[1] + dy * 0.65], INK, 2.5, 9);
      }
      text(c, '一周、すべて上り？', 320, 190, 20);
      text(c, '12段を上って出発点へ戻る、と読むと矛盾', 320, 365, 18, GRAY);
    } else {
      text(c, '一列に開くと、終点は高くなる', 320, 55, 21);
      const points = [[80, 300]];
      for (let i = 0; i < 12; i++) { points.push([80 + 35 * (i + 1), 300 - 12 * i]); points.push([80 + 35 * (i + 1), 300 - 12 * (i + 1)]); }
      path(c, points.concat([[500, 345], [80, 345]]), null, 0, true, '#e0e8df');
      path(c, points, TEAL, 4);
      line(c, [80, 300], [570, 300], GRAY, 1.5, [5, 5]);
      measure(c, [550, 156], [550, 300], '+12段', [590, 225], CORAL);
      text(c, '出発', 80, 365, 18); text(c, '終点', 500, 125, 18);
      text(c, '同じ高さへは戻れない', 320, 385, 18, TEAL);
    }
  });

  window.ILLUSION_RENDERERS = Object.assign(window.ILLUSION_RENDERERS || {}, renderers);
}());

(function () {
  'use strict';
  const W = 640, H = 400, INK = '#253044', MUTED = '#56627a';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rgb = (r, g, b) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  const gray = v => rgb(v, v, v);
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  function rect(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(x, y, w, h); }
  function circle(c, x, y, r, color) {
    c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  function ring(c, x, y, r, color, width = 2) {
    c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  }
  function line(c, x1, y1, x2, y2, color = INK, width = 2) {
    c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  function text(c, str, x, y, size = 20, color = INK, align = 'left') {
    c.font = `${size}px "Noto Sans JP", "Yu Gothic", sans-serif`;
    c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(str, x, y);
  }
  function wrap(c, str, x, y, width, size = 18, color = MUTED, leading = 27) {
    c.font = `${size}px "Noto Sans JP", "Yu Gothic", sans-serif`;
    let row = '', yy = y;
    for (const char of str) {
      if (char === '\n' || (row && c.measureText(row + char).width > width)) {
        text(c, row, x, yy, size, color); row = char === '\n' ? '' : char; yy += leading;
      } else row += char;
    }
    if (row) text(c, row, x, yy, size, color);
  }
  function cross(c, x, y, size = 10, color = INK, width = 3) {
    line(c, x - size, y, x + size, y, color, width);
    line(c, x, y - size, x, y + size, color, width);
  }
  function arrow(c, x1, y1, x2, y2, color = MUTED, width = 2) {
    line(c, x1, y1, x2, y2, color, width);
    const a = Math.atan2(y2 - y1, x2 - x1);
    line(c, x2, y2, x2 - 10 * Math.cos(a - .45), y2 - 10 * Math.sin(a - .45), color, width);
    line(c, x2, y2, x2 - 10 * Math.cos(a + .45), y2 - 10 * Math.sin(a + .45), color, width);
  }
  function frame(c, x, y, w, h, color = '#9ca7b6', width = 1.5) {
    c.strokeStyle = color; c.lineWidth = width; c.strokeRect(x, y, w, h);
  }
  function heading(c, str, color = INK) { text(c, str, W / 2, 29, 22, color, 'center'); }
  function footer(c, str, color = MUTED) { text(c, str, W / 2, 374, 18, color, 'center'); }
  function background(c, color = '#ffffff') { rect(c, 0, 0, W, H, color); }
  const renderers = {};

  renderers.C01 = function (c, s) {
    background(c, '#f6f7fa'); heading(c, s.reveal ? '背景をそろえると？' : '中央の2枚を比べる');
    const v = s.value, low = 112 - 100 * v, high = 144 + 100 * v;
    rect(c, 35, 70, 280, 258, s.reveal ? '#b4b4b4' : gray(low));
    rect(c, 325, 70, 280, 258, s.reveal ? '#b4b4b4' : gray(high));
    if (s.reveal) rect(c, 175, 187, 290, 24, '#808080');
    rect(c, 130, 154, 90, 90, '#808080'); rect(c, 420, 154, 90, 90, '#808080');
    footer(c, s.reveal ? '両方とも RGB (128, 128, 128)' : '描画色は同じ。違うのは周囲の明暗。');
  };

  renderers.C02 = function (c, s) {
    background(c, '#f4f5f7'); heading(c, s.reveal ? '文脈を外して A と B を比較' : '影の外の A ／ 影の中の B');
    const x = 80, y = 78, size = 64, ax = x + size, ay = y, bx = x + size * 4, by = y + size * 2;
    if (!s.reveal) {
      for (let r = 0; r < 4; r++) for (let col = 0; col < 6; col++)
        rect(c, x + col * size, y + r * size, size, size, (r + col) % 2 ? '#8a8a8a' : '#e4e4e4');
      c.save(); c.beginPath(); c.rect(x, y, 384, 256); c.clip();
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath();
      c.moveTo(405, 87); c.lineTo(464, 110); c.lineTo(448, 334); c.lineTo(244, 334); c.closePath(); c.fill(); c.restore();
      // Deliberate equal-RGB target; the surrounding shadow is a separate layer.
      rect(c, bx, by, size, size, '#8a8a8a');
      const gr = c.createLinearGradient(427, 0, 493, 0);
      gr.addColorStop(0, '#50775a'); gr.addColorStop(.5, '#88ad86'); gr.addColorStop(1, '#385b43');
      rect(c, 427, 76, 66, 100, gr);
      c.fillStyle = '#a2b99c'; c.beginPath(); c.ellipse(460, 76, 33, 14, 0, 0, TAU); c.fill();
      c.fillStyle = '#507256'; c.beginPath(); c.ellipse(460, 176, 33, 14, 0, 0, Math.PI); c.fill();
    } else {
      rect(c, 60, 60, 520, 286, '#c5c5c5');
      rect(c, ax, ay, size, size, '#8a8a8a'); rect(c, bx, by, size, size, '#8a8a8a');
      text(c, '同じ塗りを取り出す', 320, 310, 20, INK, 'center');
    }
    text(c, 'A', ax + size / 2, ay + size / 2, 22, '#111111', 'center');
    text(c, 'B', bx + size / 2, by + size / 2, 22, '#111111', 'center');
    footer(c, s.reveal ? 'A・B の面は RGB (138, 138, 138)' : '照明と表面を分けて読むための、独自の簡略作図');
  };

  function stripedTargets(c, s, chromatic) {
    background(c, '#f7f8fa'); heading(c, s.reveal ? '縞を取り除いた状態' : chromatic ? '同じ緑が、違う色調に見える？' : '縞の中の同じ灰色');
    const h = Math.round(14 + s.value * 20), top = 76, bottom = 328;
    const leftX = 166, rightX = 398, target = chromatic ? '#65cba6' : '#969696';
    c.save(); c.beginPath(); c.rect(60, top, 520, bottom - top); c.clip();
    if (s.reveal) rect(c, 60, top, 520, bottom - top, '#dddddd');
    for (let i = 0, yy = top; yy < bottom; yy += h, i++) {
      if (!s.reveal) rect(c, 60, yy, 520, h, chromatic ? (i % 2 ? '#eb7eb0' : '#445cc6') : (i % 2 ? '#ffffff' : '#141414'));
      rect(c, i % 2 ? rightX : leftX, yy, 76, h, target);
    }
    c.restore();
    footer(c, s.reveal ? (chromatic ? '緑の断片はすべて RGB (101, 203, 166)' : '灰色の断片はすべて RGB (150, 150, 150)') : '縞の太さでも見え方が変わる');
  }
  renderers.C03 = (c, s) => stripedTargets(c, s, false);

  renderers.C04 = function (c, s) {
    background(c, '#f5f6f8'); heading(c, '勾配の端に、明るい帯・暗い帯が見える？');
    const ramp = Math.round(90 + 230 * s.value), x1 = Math.round(320 - ramp / 2), x2 = x1 + ramp;
    const yy = 76, hh = s.reveal ? 156 : 230;
    rect(c, 60, yy, x1 - 60, hh, '#404040');
    const g = c.createLinearGradient(x1, 0, x2, 0); g.addColorStop(0, '#404040'); g.addColorStop(1, '#cccccc');
    rect(c, x1, yy, x2 - x1, hh, g); rect(c, x2, yy, 580 - x2, hh, '#cccccc');
    if (s.reveal) {
      text(c, 'RGB描画値の断面（輝度の実測ではない）', 320, 262, 18, MUTED, 'center');
      line(c, 60, 342, 580, 342, '#a6adba', 1);
      line(c, 60, 326, x1, 326, '#258366', 3); line(c, x1, 326, x2, 292, '#258366', 3); line(c, x2, 292, 580, 292, '#258366', 3);
      text(c, '64', 66, 306, 18, INK); text(c, '204', 568, 277, 18, INK, 'right');
      c.save(); c.setLineDash([5, 5]); line(c, x1, 238, x1, 342, '#95a1b2', 1); line(c, x2, 238, x2, 342, '#95a1b2', 1); c.restore();
    }
    footer(c, s.reveal ? '余分なピークを描かず、平坦 → 増加 → 平坦' : '明暗の勾配の幅を変えて比較する');
  };

  renderers.C05 = function (c, s) {
    background(c, '#f7f8fb'); heading(c, s.reveal ? '黒い区画を外した状態' : '周辺の交差点を観察');
    const street = 9 + Math.round(s.value * 15);
    rect(c, 55, 64, 530, 276, s.reveal ? '#ffffff' : '#101010');
    if (!s.reveal) {
      for (let x = 85; x <= 565; x += 60) rect(c, x - street / 2, 64, street, 276, '#ffffff');
      for (let y = 82; y <= 322; y += 60) rect(c, 55, y - street / 2, 530, street, '#ffffff');
    } else {
      frame(c, 55, 64, 530, 276, '#c7cdd6');
      frame(c, 150, 150, 90, 90, '#a6adba'); frame(c, 400, 150, 90, 90, '#a6adba');
      text(c, '交差点の白', 195, 275, 20, INK, 'center'); text(c, '道路の白', 445, 275, 20, INK, 'center');
    }
    footer(c, s.reveal ? 'どちらも RGB (255, 255, 255)' : '暗い斑点は描いていません。画像は静止しています。');
  };

  renderers.C06 = function (c, s) {
    background(c, '#f7f8fb'); heading(c, s.reveal ? '格子を外して白い円だけに' : '白い点の中に、黒い点が見える？');
    rect(c, 55, 62, 530, 280, s.reveal ? '#6e7787' : '#101010');
    if (!s.reveal) {
      for (let i = 0; i < 7; i++) rect(c, 110 + i * 70 - 6, 62, 12, 280, '#8f8f8f');
      for (let i = 0; i < 4; i++) rect(c, 55, 95 + i * 70 - 6, 530, 12, '#8f8f8f');
    }
    for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) circle(c, 110 + col * 70, 95 + row * 70, 9, '#ffffff');
    footer(c, s.reveal ? '28個の白い円。黒い点を描く処理はありません。' : '動いているのは画像ではなく、見えの印象です。');
  };

  renderers.C07 = function (c, s) {
    background(c, '#f6f7f9'); heading(c, s.reveal ? '中央の勾配だけを隠す' : '中央から離れた左右の面を比較');
    rect(c, 60, 78, 520, 244, '#969696');
    const depth = 8 + 36 * s.value;
    if (!s.reveal) {
      const a = c.createLinearGradient(284, 0, 320, 0); a.addColorStop(0, gray(150)); a.addColorStop(1, gray(150 - depth));
      const b = c.createLinearGradient(320, 0, 356, 0); b.addColorStop(0, gray(150 + depth)); b.addColorStop(1, gray(150));
      rect(c, 284, 78, 36, 244, a); rect(c, 320, 78, 36, 244, b);
    } else {
      rect(c, 281, 65, 78, 270, '#f6f7f9');
      text(c, '左の面', 170, 200, 20, '#ffffff', 'center'); text(c, '右の面', 470, 200, 20, '#ffffff', 'center');
    }
    footer(c, s.reveal ? '左右の広い面は RGB (150, 150, 150)' : '実際の明暗差は中央72pxの範囲だけ');
  };

  function wavyLoop(c, cx, cy, rx, ry, inset, color, width) {
    c.strokeStyle = color; c.lineWidth = width; c.lineJoin = 'round'; c.beginPath();
    for (let j = 0; j <= 240; j++) {
      const a = j / 240 * TAU, r = 3.2 * Math.sin(12 * a);
      const x = cx + (rx - inset + r) * Math.cos(a), y = cy + (ry - inset + r) * Math.sin(a);
      if (j === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath(); c.stroke();
  }
  renderers.C08 = function (c, s) {
    background(c); heading(c, s.reveal ? '紫の外側輪郭を外した状態' : '白い内部が、薄く橙色に見える？');
    const width = 2.5 + s.value * 2.5;
    if (!s.reveal) wavyLoop(c, 175, 202, 109, 99, 0, '#713a9b', width);
    wavyLoop(c, 175, 202, 109, 99, width, '#ed9a35', width);
    wavyLoop(c, 465, 202, 109, 99, width, '#ed9a35', width);
    text(c, s.reveal ? '橙の輪郭だけ' : '紫＋内側の橙', 175, 333, 20, INK, 'center');
    text(c, '橙の輪郭だけ', 465, 333, 20, INK, 'center');
    footer(c, '両方の内部に、色付きの面は塗っていません。');
  };

  renderers.C09 = function (c, s) {
    background(c); heading(c, s.reveal ? '外側の黒い線だけを外す' : '色の線の間に、薄い面が見える？');
    const cx = 320, cy = 204;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      line(c, cx, cy, cx + 71 * Math.cos(a), cy + 71 * Math.sin(a), '#169ec2', 4);
      if (!s.reveal) line(c, cx + 71 * Math.cos(a), cy + 71 * Math.sin(a), cx + 143 * Math.cos(a), cy + 143 * Math.sin(a), '#151515', 4);
    }
    footer(c, '色付きなのは細線だけ。線の間は白です。');
  };
  renderers.C10 = (c, s) => stripedTargets(c, s, true);

  renderers.C11 = function (c, s) {
    background(c, '#f7f8fa'); heading(c, s.reveal ? '背景の色を取り除く' : '同じ灰色に、色味がついて見える？');
    const a = mix([185, 185, 185], [224, 82, 98], s.value), b = mix([185, 185, 185], [68, 185, 197], s.value);
    rect(c, 35, 70, 280, 260, s.reveal ? '#c4c4c4' : rgb(...a));
    rect(c, 325, 70, 280, 260, s.reveal ? '#c4c4c4' : rgb(...b));
    rect(c, 130, 155, 90, 90, '#a0a0a0'); rect(c, 420, 155, 90, 90, '#a0a0a0');
    footer(c, '中央2枚は RGB (160, 160, 160)');
  };

  renderers.C12 = function (c, s) {
    background(c, '#f4f5f8'); heading(c, s.reveal ? 'カードを中立背景に取り出す' : '照明色の違いを模した2つの場面');
    const amt = .35 + s.value * .65;
    const warm = mix([232, 232, 232], [250, 219, 186], amt), cool = mix([232, 232, 232], [186, 219, 250], amt);
    const scenes = [{cx:165,tint:[255,200,143],card:warm,name:'暖色の照明'}, {cx:475,tint:[143,200,255],card:cool,name:'寒色の照明'}];
    for (const d of scenes) {
      const x = d.cx - 135;
      if (!s.reveal) {
        rect(c, x, 72, 270, 255, rgb(...mix([214, 214, 214], d.tint, .28 + .3 * s.value)));
        rect(c, x + 15, 227, 240, 83, rgb(...mix([153, 153, 153], d.tint, .15)));
        const colors = [[125, 87, 59], [48, 111, 127], [130, 74, 108]];
        colors.forEach((col, i) => rect(c, x + 19 + i * 80, 245, 65, 45, rgb(...mix(col, d.tint, .2))));
        rect(c, d.cx - 40, 118, 102, 126, rgb(...mix([100,100,100], d.tint, .15)));
      }
      rect(c, d.cx - 51, 106, 102, 126, rgb(...d.card));
      if (s.reveal) frame(c, d.cx - 51, 106, 102, 126, '#c0c5cf');
      text(c, d.name, d.cx, 350, 20, INK, 'center');
      if (s.reveal) { text(c, `RGB (${d.card.join(', ')})`, d.cx, 273, 18, INK, 'center'); text(c, '同じ形・異なる描画色', d.cx, 303, 18, MUTED, 'center'); }
    }
    footer(c, '照明と色恒常性の模式図。物理的な照明実験ではありません。');
  };

  renderers.C13 = function (c, s) {
    // No inducer before manual play, while paused, or after the first eight seconds.
    background(c, '#b0b0b0');
    const inducing = s.running && s.time < 8 && !s.reveal;
    const initial = s.time === 0 && !s.running && !s.reveal;
    if (inducing) circle(c, 320, 195, 70, '#c84bb4');
    if (initial) { ring(c, 320, 195, 70, '#858585', 2); text(c, '開始前：輪郭だけ', 320, 300, 20, '#303030', 'center'); }
    cross(c, 320, 195, 8, '#222222', 3);
    heading(c, inducing ? `中心の＋を見る　残り ${Math.max(1, Math.ceil(8 - s.time))} 秒` : initial ? '再生で開始：色の提示は最大8秒' : '今は灰色だけを表示しています', '#292929');
    if (s.reveal) {
      frame(c, 232, 107, 176, 176, '#6c6c6c', 1);
      text(c, '円の場所も RGB (176, 176, 176)', 320, 322, 20, '#292929', 'center');
    }
    if (inducing) { rect(c, 120, 333, 400, 6, '#969696'); rect(c, 120, 333, 400 * clamp(s.time / 8, 0, 1), 6, '#5e5e5e'); }
    footer(c, inducing ? '停止すると色の提示を終了します。' : '緑の円は描いていません。見えない場合もあります。', '#353535');
  };

  renderers.C14 = function (c, s) {
    background(c, '#bcbcbc'); heading(c, '中心の＋を見て、薄い周辺の斑点を観察', '#343434');
    const alpha = .11 + .38 * s.value;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, x = 320 + 164 * Math.cos(a), y = 207 + 118 * Math.sin(a);
      const g = c.createRadialGradient(x, y, 0, x, y, 24);
      g.addColorStop(0, `rgba(162,91,169,${alpha})`); g.addColorStop(.55, `rgba(162,91,169,${alpha * .6})`); g.addColorStop(1, 'rgba(162,91,169,0)');
      circle(c, x, y, 24, g);
      if (s.reveal) ring(c, x, y, 26, '#626875', 2);
    }
    cross(c, 320, 207, 9, '#303030', 3);
    footer(c, s.reveal ? '輪郭を加えて位置を確認。斑点は残っています。' : 'プログラムによる消去やフェードはありません。', '#343434');
  };

  renderers.C15 = function (c, s) {
    background(c); heading(c, '左目を閉じ、右目で左の＋を見る');
    const x = 170 + 180 + 100 * s.value;
    cross(c, 170, 195, 13, '#121212', 4); circle(c, x, 212, 13, '#121212');
    if (s.reveal) {
      c.save(); c.setLineDash([6, 5]); frame(c, x - 32, 180, 64, 64, '#7f8fa6', 2); c.restore();
      arrow(c, x + 56, 130, x + 9, 181, '#5c6b82', 2);
      text(c, '点はここに残る', 420, 103, 20, INK, 'center');
      line(c, 170, 280, x, 280, '#8d98a8', 1.5);
      line(c, 170, 272, 170, 288, '#8d98a8', 1.5); line(c, x, 272, x, 288, '#8d98a8', 1.5);
    }
    text(c, '注視する', 170, 315, 20, INK, 'center'); text(c, '直接見ない', x, 315, 20, INK, 'center');
    footer(c, '無理のない距離で調整。画面の点を消す処理はありません。');
  };

  renderers.C16 = function (c, s) {
    background(c); heading(c, '白い切れ目が盲点に入ると、線は続く？');
    cross(c, 170, 195, 13, '#121212', 4);
    rect(c, 315, 197, 265, 30, '#267cad');
    const gap = 26 + s.value * 52, gx = 425 - gap / 2;
    rect(c, gx, 186, gap, 52, '#ffffff');
    if (s.reveal) {
      c.save(); c.setLineDash([5,5]); frame(c, gx, 185, gap, 54, '#ce763b', 2); c.restore();
      arrow(c, 425, 119, 425, 180, '#ce763b', 2);
      text(c, '実際の白い切れ目', 425, 98, 20, INK, 'center');
      text(c, '左右の帯だけを描画', 425, 290, 20, INK, 'center');
    }
    text(c, '右目で＋を注視', 170, 316, 20, INK, 'center');
    footer(c, '左目を閉じ、C15と同じ距離の調整を使います。');
  };

  function pacman(c, x, y, radius, middle, half, rotation) {
    circle(c, x, y, radius, '#161616');
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x, y);
    c.arc(x, y, radius + 1, middle - half + rotation, middle + half + rotation); c.closePath(); c.fill();
  }
  renderers.C17 = function (c, s) {
    background(c); heading(c, s.reveal ? '切り口を外向きに回す' : '中央に、白い三角形が見える？');
    const points = [[320,99],[174,292],[466,292]], rot = s.reveal ? Math.PI : (s.value - .5) * Math.PI;
    points.forEach((p, i) => {
      const others = points.filter((_, j) => i !== j);
      const aa = others.map(q => Math.atan2(q[1] - p[1], q[0] - p[0]));
      const mid = Math.atan2(Math.sin(aa[0]) + Math.sin(aa[1]), Math.cos(aa[0]) + Math.cos(aa[1]));
      const half = Math.acos(clamp(Math.cos(aa[0] - aa[1]), -1, 1)) / 2;
      pacman(c, p[0], p[1], 47, mid, half, rot);
    });
    footer(c, '描いているのは欠けた3つの円。中央の辺は描いていません。');
  };

  renderers.C18 = function (c, s) {
    background(c, '#f5f6f8'); heading(c, s.reveal ? '遮蔽物を外して、実際の形を確認' : '板の後ろで、1つの円につながる？');
    circle(c, 320, 201, 105, '#de9140');
    const broken = s.variant % 2 !== 0;
    if (broken) rect(c, 282, 88, 76, 226, '#f5f6f8');
    const moving = s.time > 0 ? 135 * (1 - Math.cos(Math.min(s.time, 20) * .6)) / 2 : 0;
    const panelX = s.reveal ? 500 : 270 + (s.value - .5) * 260 + moving;
    rect(c, panelX, 77, 100, 248, '#5b6f8a');
    line(c, panelX + 2, 77, panelX + 2, 325, '#d4dbe4', 3);
    if (s.reveal) {
      text(c, broken ? '中央が切れている' : '完全な円', 320, 337, 20, INK, 'center');
      text(c, '板', 550, 201, 20, '#ffffff', 'center');
    }
    footer(c, s.reveal ? '別条件では、見えなかった中央の形が変わります。' : '隠れた部分の形は、初期像だけでは一意に決まりません。');
  };

  renderers.C19 = function (c, s) {
    background(c); heading(c, s.reveal ? '本当の細い円周を加えた状態' : '線の端が、明るい円盤を作る？');
    const n = 4 + 4 * Math.round(s.value * 2);
    for (const [cx,cy] of [[205,139],[435,139],[205,281],[435,281]]) {
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU;
        line(c, cx + 25 * Math.cos(a), cy + 25 * Math.sin(a), cx + 60 * Math.cos(a), cy + 60 * Math.sin(a), '#191919', 3);
      }
      if (s.reveal) ring(c, cx, cy, 25, '#191919', 1.5);
    }
    footer(c, '中心も外側も同じ白。明るい面は加えていません。');
  };

  renderers.C20 = function (c, s) {
    background(c, '#f4f6fa'); heading(c, '色順応の概念図：色の変化は描画による説明');
    const t = s.time > 0 ? clamp(s.time / 7, 0, 1) : s.value;
    const input = [222,160,124], output = mix(input, [186,186,186], t);
    text(c, '色の偏った入力', 132, 82, 20, INK, 'center');
    text(c, '中立へ近づくモデル', 505, 82, 20, INK, 'center');
    rect(c, 60, 112, 145, 140, rgb(...input)); rect(c, 432, 112, 145, 140, rgb(...output));
    arrow(c, 219, 183, 268, 183, '#6f7f95', 3); arrow(c, 372, 183, 421, 183, '#6f7f95', 3);
    circle(c, 320, 183, 43, '#e4eaf2');
    text(c, '応答の', 320, 169, 19, INK, 'center'); text(c, '再調整', 320, 196, 19, INK, 'center');
    if (s.reveal) {
      text(c, `RGB ${input.join(', ')}`, 132, 281, 18, INK, 'center'); text(c, `RGB ${output.join(', ')}`, 505, 281, 18, INK, 'center');
      rect(c, 238, 298, 68, 35, rgb(...input)); rect(c, 334, 298, 68, 35, rgb(...output));
      frame(c, 238, 298, 68, 35, '#8f9caf'); frame(c, 334, 298, 68, 35, '#8f9caf');
      text(c, '入力', 272, 347, 18, MUTED, 'center'); text(c, '出力', 368, 347, 18, MUTED, 'center');
    } else {
      text(c, 'RGB補間の説明モデル', 320, 288, 20, INK, 'center');
      text(c, '観察者の順応を測定していません', 320, 325, 20, MUTED, 'center');
    }
    footer(c, '時間的な順応の考え方。実際の順応速度や量の再現ではありません。');
  };

  renderers.C21 = function (c, s) {
    const bg = Math.round(8 + Math.pow(s.value, 3) * 230), lightInk = bg < 110 ? '#eef2f8' : '#202a3a';
    background(c, gray(bg)); heading(c, s.reveal ? '色をそろえ、位置と大きさを確認' : '赤と青の輪が、前後に離れて見える？', lightInk);
    const mono = bg < 110 ? '#bcbcbc' : '#545454';
    for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) {
      ring(c, 112 + i * 104, 138 + row * 126, 36, s.reveal ? mono : (i + row) % 2 ? '#244af0' : '#f12637', 10);
      if (s.reveal) { line(c, 104 + i * 104, 138 + row * 126, 120 + i * 104, 138 + row * 126, lightInk, 1); line(c, 112 + i * 104, 130 + row * 126, 112 + i * 104, 146 + row * 126, lightInk, 1); }
    }
    footer(c, s.reveal ? 'すべて半径36。影・立体変換・左右眼用画像なし。' : '背景や片目で見え方が変わることがあります。個人差あり。', lightInk);
  };

  function benhamDisk(c, cx, cy, angle) {
    c.save(); c.translate(cx, cy); c.rotate(angle);
    circle(c, 0, 0, 133, '#ffffff');
    c.fillStyle = '#141414'; c.beginPath(); c.moveTo(0,0); c.arc(0,0,133,Math.PI / 2,Math.PI * 1.5); c.closePath(); c.fill();
    for (let group = 0; group < 4; group++) for (let j = 0; j < 3; j++) {
      c.strokeStyle = '#141414'; c.lineWidth = 5; c.beginPath();
      c.arc(0,0,26 + group * 24 + j * 8, -Math.PI / 2 + group * Math.PI / 4 + .06, -Math.PI / 2 + (group + 1) * Math.PI / 4 - .06); c.stroke();
    }
    ring(c, 0, 0, 133, '#6c6c6c', 2); c.restore();
  }
  renderers.C22 = function (c, s) {
    background(c, '#f4f4f4'); heading(c, 'ベンハム型円盤：構造だけを低速で示す');
    const angle = s.reveal ? 0 : s.value * TAU + s.time * .12;
    benhamDisk(c, 212, 205, angle);
    text(c, '白黒の配置', 462, 93, 22, INK, 'center');
    wrap(c, '適切な時間変化では主観色が生じることがあります。', 380, 137, 225, 20, INK, 30);
    if (s.reveal) {
      rect(c, 402, 235, 60, 58, '#ffffff'); frame(c, 402, 235, 60, 58, '#9b9b9b'); rect(c, 490, 235, 60, 58, '#141414');
      text(c, 'R = G = B', 475, 318, 20, INK, 'center');
    } else wrap(c, 'この再生は低速です。色を誘発する実演は行いません。', 380, 245, 225, 20, MUTED, 30);
    footer(c, '高速回転やフリッカーを使わない模式図です。');
  };

  function grating(c, x, y, w, h, vertical) {
    rect(c, x, y, w, h, '#ffffff');
    c.save(); c.beginPath(); c.rect(x,y,w,h); c.clip();
    if (vertical) { for (let xx = x; xx < x+w; xx+=24) rect(c,xx,y,12,h,'#111111'); }
    else { for (let yy = y; yy < y+h; yy+=24) rect(c,x,yy,w,12,'#111111'); }
    c.restore(); frame(c,x,y,w,h,'#8b95a6',1);
  }
  renderers.C23 = function (c, s) {
    background(c, '#f5f6f9'); heading(c, 'マッカロー効果：向きと色の結び付きの模式図');
    text(c, '縦のテスト縞', 175, 79, 20, INK, 'center'); text(c, '横のテスト縞', 465, 79, 20, INK, 'center');
    grating(c, 103, 107, 144, 130, true); grating(c, 393, 107, 144, 130, false);
    if (s.reveal) {
      rect(c, 160, 281, 70, 47, '#ffffff'); frame(c,160,281,70,47,'#8b95a6'); rect(c, 410, 281, 70, 47, '#111111');
      text(c, '白：255,255,255', 195, 348, 18, INK, 'center'); text(c, '黒：17,17,17', 445, 348, 18, INK, 'center');
    } else {
      arrow(c, 175, 250, 175, 283, '#7b899d', 2); arrow(c, 465, 250, 465, 283, '#7b899d', 2);
      circle(c, 142, 309, 15, '#80bcae'); circle(c, 432, 309, 15, '#c48db3');
      text(c, '残効色の例', 167, 310, 19, INK); text(c, '残効色の例', 457, 310, 19, INK);
      text(c, '色チップは説明用。実際の残効ではありません。', 320, 348, 18, MUTED, 'center');
    }
    footer(c, '誘導用の色付き縞や、長時間の交互提示は行いません。');
  };

  renderers.C24 = function (c, s) {
    background(c, '#f5f7fa'); heading(c, '波長への感度の重みが変わる：定性的な模式図');
    const p = s.time > 0 ? clamp(s.time / 8, 0, 1) : s.value;
    const darkColor = '#277f91', lightColor = '#ac792d';
    text(c, '暗所寄り：桿体系', 185, 70, 20, darkColor, 'center'); text(c, '明所寄り：錐体系', 465, 70, 20, lightColor, 'center');
    line(c, 76, 305, 580, 305, '#8491a4', 2); arrow(c, 76, 305, 76, 102, '#8491a4', 2);
    text(c, '感度', 42, 112, 18, MUTED, 'center');
    function curve(center, width, color, opacity) {
      c.save(); c.globalAlpha = opacity; c.strokeStyle = color; c.lineWidth = 4; c.beginPath();
      for (let x = 90; x <= 570; x+=2) { const y = 305 - 182 * Math.exp(-.5 * Math.pow((x-center)/width,2)); if (x===90)c.moveTo(x,y);else c.lineTo(x,y); }
      c.stroke(); c.restore();
    }
    curve(274,70,darkColor,s.reveal ? 1 : .25 + .75*p); curve(352,80,lightColor,s.reveal ? 1 : 1-.75*p);
    if (s.reveal) {
      c.save(); c.setLineDash([5,5]); line(c,274,123,274,305,darkColor,1.5); line(c,352,123,352,305,lightColor,1.5); c.restore();
      arrow(c, 344, 100, 282, 100, '#6c7789', 2);
    }
    text(c, '短波長寄り', 133, 332, 18, MUTED, 'center'); text(c, '長波長寄り', 524, 332, 18, MUTED, 'center');
    footer(c, '曲線は測定値ではありません。画面上で暗順応を起こす実験なし。');
  };

  const safe = {};
  for (const [id, draw] of Object.entries(renderers)) {
    safe[id] = function (ctx, state) {
      const input = state || {};
      const s = { reveal: !!input.reveal, running: !!input.running,
        time: Math.max(0, Number.isFinite(input.time) ? input.time : 0),
        value: clamp(Number.isFinite(input.value) ? input.value : .5, 0, 1),
        variant: Number.isFinite(input.variant) ? Math.floor(input.variant) : 0,
        seed: Number.isFinite(input.seed) ? input.seed : 0 };
      ctx.save();
      try { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]); draw(ctx, s); }
      finally { ctx.restore(); }
    };
  }
  Object.assign(window.ILLUSION_RENDERERS || (window.ILLUSION_RENDERERS = {}), safe);
})();

(function () {
  'use strict';
  const R = {}, PI = Math.PI, TAU = PI * 2;
  // Capture the first displayed flash frame, not an ideal continuous-time crossing.
  // Per-context data only; the renderer owns no clock or animation loop.
  const flashFrames = new WeakMap();
  const C = {bg:'#f5f7fa', ink:'#233648', muted:'#617487', pale:'#d9e2e9', teal:'#287e7a', orange:'#cf6545', blue:'#4b78aa'};
  const val = s => Math.max(0, Math.min(1, Number.isFinite(s.value) ? s.value : .5));
  const time = s => Math.max(0, s.time || 0);
  const mod = (x,m) => ((x % m) + m) % m;
  const rand = (i,seed=1) => { const x=Math.sin(i*127.1+seed*311.7)*43758.5453; return x-Math.floor(x); };
  function text(c,t,x,y,size=20,color=C.ink,align='center') {c.fillStyle=color;c.font=`${size}px "Noto Sans JP", "Noto Sans CJK JP", sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillText(t,x,y);}
  function line(c,x1,y1,x2,y2,color=C.ink,w=2,dash=[]) {c.save();c.strokeStyle=color;c.lineWidth=w;c.setLineDash(dash);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();}
  function circle(c,x,y,r,fill,stroke,w=2) {c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
  function rect(c,x,y,w,h,fill,stroke,sw=2) {if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}if(stroke){c.strokeStyle=stroke;c.lineWidth=sw;c.strokeRect(x,y,w,h);}}
  function arrow(c,x1,y1,x2,y2,color=C.orange,w=3) {line(c,x1,y1,x2,y2,color,w);const a=Math.atan2(y2-y1,x2-x1);line(c,x2,y2,x2-11*Math.cos(a-.45),y2-11*Math.sin(a-.45),color,w);line(c,x2,y2,x2-11*Math.cos(a+.45),y2-11*Math.sin(a+.45),color,w);}
  function cross(c,x,y,r=8,color=C.ink,w=2) {line(c,x-r,y,x+r,y,color,w);line(c,x,y-r,x,y+r,color,w);}
  function polygon(c,pts,fill,stroke,w=2) {c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
  function title(c,t){text(c,t,320,28,21);}
  function footer(c,t){text(c,t,320,376,18,C.muted);}
  function grid(c,x,y,w,h,step=30,color=C.pale){for(let a=x;a<=x+w;a+=step)line(c,a,y,a,y+h,color,1);for(let b=y;b<=y+h;b+=step)line(c,x,b,x+w,b,color,1);}
  function neutral(c,label='静止した比較画面') {rect(c,95,70,450,260,'#e1e4e6');grid(c,95,70,450,260,30,'#aab2b7');cross(c,320,200);title(c,label);}
  function stopped(s,limit=8) {return time(s)>=limit || (time(s)>0 && !s.running);}
  function register(id,fn){R[id]=(c,s)=>{c.save();rect(c,0,0,640,400,C.bg);c.lineCap='round';c.lineJoin='round';fn(c,s);c.restore();};}

  register('M01',(c,s)=>{
    title(c,'純粋ファイとベータの違い：模式図');
    const delay=Math.round(40+val(s)*260);
    [130,320,510].forEach((x,i)=>{rect(c,x-78,80,156,105,'#e8edf2',C.pale);text(c,['刺激 A','間の印象','刺激 B'][i],x,62,18);});
    circle(c,130,132,19,C.ink);circle(c,510,132,19,C.ink);
    if(!s.reveal){c.save();c.globalAlpha=.17;for(let i=0;i<9;i++)circle(c,280+i*10,132,15,C.ink);c.restore();text(c,'動きの感じ',320,166,18);}
    else {text(c,'物体の描画なし',320,132,18,C.orange);line(c,70,210,570,210,C.pale,2);[130,510].forEach(x=>{line(c,x,82,x,230,C.orange,2,[5,5]);circle(c,x,210,5,C.orange);});}
    text(c,'ファイ：対象が移ったという印象を伴わない動き',320,253,19);
    text(c,'ベータ：同じ対象が A → B へ移ったように見える',320,290,19);
    line(c,135,328,505,328,C.pale,2);rect(c,160,316,26,24,C.ink);const tx=240+val(s)*220;rect(c,tx,316,26,24,C.ink);arrow(c,192,328,tx-8,328,C.muted,2);text(c,`提示間隔の概念値 ${delay} ms`,320,352,18,C.muted);
    footer(c,'この図は点滅実験ではなく、知覚の区別を表す。');
  });

  register('M02',(c,s)=>{
    title(c,'離れた位置だけを順に表示');
    const step=.45+.4*val(s),n=Math.floor(time(s)/step)%6;
    if(s.reveal){for(let i=0;i<6;i++){circle(c,140+i*72,200,23,null,C.pale,2);text(c,String(i+1),140+i*72,250,18,C.muted);}line(c,140,200,500,200,C.pale,2,[4,6]);}
    circle(c,140+n*72,200,19,C.teal);text(c,`1コマ ${Math.round(step*1000)} ms`,320,300,19,C.muted);
    footer(c,s.reveal?'輪郭の場所だけに描画。中間位置は描いていない。':'再生して、別の出現と1つの移動の印象を比べる。');
  });

  register('M03',(c,s)=>{
    title(c,'逆ファイ：コマごとの比較（模式図）');
    const shift=12+Math.round(val(s)*24);
    [70,350].forEach(x=>rect(c,x,83,220,210,'#aab0b5',C.pale));
    text(c,'コマ A',180,61,20);text(c,'コマ B：明暗を反転',460,61,20);
    rect(c,140,143,60,75,'#37414a');rect(c,420+shift,143,60,75,'#f1f2f3');
    circle(c,170,178,10,'#f1f2f3');circle(c,450+shift,178,10,'#37414a');
    line(c,112,250,248,250,'#626e79',2);line(c,392,250,528,250,'#626e79',2);
    if(s.reveal){[140,200].forEach(x=>{line(c,x,130,x,255,C.orange,2,[5,4]);line(c,x+280,130,x+280,255,C.orange,2,[5,4]);arrow(c,x+280,263,x+280+shift,263,C.orange,2);});}
    arrow(c,130,322,250,322,C.orange);text(c,'輪郭の変位 →',190,350,19,C.orange);
    arrow(c,510,322,390,322,C.blue);text(c,'知覚しうる向き ←',450,350,19,C.blue);
    footer(c,'高速点滅は行わない。左右は同じ特徴の対応を示す。');
  });

  register('M04',(c,s)=>{
    title(c,'この模様は、まったく動いていない');
    const amp=.35+.65*val(s),base=[28,100,242,179];
    [[190,130],[450,130],[190,285],[450,285]].forEach(([x,y],j)=>{
      for(let i=0;i<48;i++){const a=i*TAU/48,b=(i+1)*TAU/48;const v=Math.round(135+(base[(j%2?47-i:i)%4]-135)*amp);c.beginPath();c.arc(x,y,61,a,b);c.arc(x,y,28,b,a,true);c.closePath();c.fillStyle=`rgb(${v},${v},${v})`;c.fill();}
      if(s.reveal){cross(c,x,y,10,C.orange);for(let k=0;k<8;k++){const a=k*TAU/8;line(c,x+64*Math.cos(a),y+64*Math.sin(a),x+71*Math.cos(a),y+71*Math.sin(a),C.orange,3);}circle(c,x,y,72,null,C.orange,1);}
    });
    footer(c,s.reveal?'固定の中心と目盛り。図形の位置・角度は更新しない。':'自然に視線を移す。見え方の強さには個人差がある。');
  });

  register('M05',(c,s)=>{
    title(c,'中央と周囲で、長方形の向きが異なる');
    const a=18+val(s)*18,b=7;
    function checks(vertical){for(let y=50;y<350;y+=vertical?a:b)for(let x=80;x<560;x+=vertical?b:a){const i=Math.floor((x-80)/(vertical?b:a)),j=Math.floor((y-50)/(vertical?a:b));rect(c,x,y,vertical?b:a,vertical?a:b,(i+j)%2?'#e7ecee':'#324753');}}
    c.save();c.beginPath();c.rect(80,50,480,300);c.clip();checks(false);c.restore();
    if(!s.reveal){c.save();c.beginPath();c.arc(320,200,97,0,TAU);c.clip();checks(true);c.restore();}
    if(s.reveal){circle(c,320,200,97,null,C.orange,3);cross(c,320,200,10,C.orange);}
    footer(c,s.reveal?'模様の向きをそろえると、相対的な滑りの手がかりが減る。':'画面を揺らす処理はない。自然な視線移動で観察する。');
  });

  register('M06',(c,s)=>{
    if(stopped(s)||s.reveal){neutral(c,'比較：格子は静止している');footer(c,'必要なだけ休む。8秒以上の順応は行わない。');return;}
    title(c,s.running?'中央を楽に見る：8秒で静止格子へ':'再生すると流れる模様を8秒だけ表示');
    c.save();c.beginPath();c.rect(95,75,450,250);c.clip();
    const d=time(s)*(18+val(s)*38);
    for(let x=95;x<545;x+=2){const lum=Math.round(168+38*Math.sin((x-d)*TAU/76));rect(c,x,75,2,250,`rgb(${lum},${lum},${lum})`);}
    c.restore();cross(c,320,200,7,C.ink);rect(c,95,343,450,5,C.pale);rect(c,95,343,450*Math.min(1,time(s)/8),5,C.teal);
    footer(c,s.running?`あと ${Math.max(0,Math.ceil(8-time(s)))} 秒。停止すると直ちに静止格子へ。`:'短い弱めの刺激なので、残効が出ない場合もある。');
  });

  register('M07',(c,s)=>{
    title(c,'周囲の枠だけを動かす');const x=320+Math.sin(time(s)*.8)*(20+val(s)*55);
    if(s.reveal){grid(c,70,70,500,260,30);cross(c,320,200,22,C.orange);line(c,320,60,320,340,C.orange,2,[5,5]);}
    rect(c,x-200,88,400,224,null,C.teal,5);for(let i=-3;i<=3;i++)line(c,x+i*50,88,x+i*50,108,C.teal,4);
    circle(c,320,200,13,C.orange);footer(c,s.reveal?'点の座標は常に (320, 200)。動いているのは枠。':'中央の点が、枠と反対へ動くように見えることがある。');
  });

  register('M08',(c,s)=>{
    title(c,'中心から外へ広がるオプティックフロー');const seed=s.seed||1;
    rect(c,70,66,500,270,'#26394c');
    c.save();c.beginPath();c.rect(70,66,500,270);c.clip();
    for(let i=0;i<100;i++){const a=rand(i,seed)*TAU,base=.06+rand(i+120,seed)*.9;const r=.06*Math.exp(mod(Math.log(base/.06)+time(s)*(.2+.26*val(s)),Math.log(1/.06)));circle(c,320+250*r*Math.cos(a),201+136*r*Math.sin(a),1.5+r*2,'#c3d9e2');}
    if(s.reveal)for(let i=0;i<8;i++){const a=i*TAU/8;arrow(c,320+90*Math.cos(a),201+48*Math.sin(a),320+185*Math.cos(a),201+100*Math.sin(a),'#e0a082',2);}
    c.restore();rect(c,70,66,500,270,null,s.reveal?C.orange:C.pale,3);cross(c,320,201,6,'#f0f3f5');
    footer(c,s.reveal?'画面の枠は静止し、点だけが外へ移動している。':'小窓では自己運動感が弱い。違和感があれば停止する。');
  });

  register('M09',(c,s)=>{
    title(c,'窓の内側だけでは、線の全方向は分からない');const dx=48*Math.sin(time(s)*(.5+.5*val(s)));
    if(s.reveal){grid(c,90,55,460,280,35);line(c,180+dx,330,460+dx,50,C.teal,8);circle(c,180+dx,330,6,C.orange);circle(c,460+dx,50,6,C.orange);}
    else {circle(c,320,190,100,'#e2e8ed');c.save();c.beginPath();c.arc(320,190,100,0,TAU);c.clip();line(c,180+dx,330,460+dx,50,C.teal,8);c.restore();}
    circle(c,320,190,100,null,C.ink,3);
    if(s.reveal){arrow(c,420,302,490,302,C.orange,3);arrow(c,490,302,420,302,C.orange,3);text(c,'実際は水平',455,331,18,C.orange);arrow(c,275,160,325,210,C.blue,3);arrow(c,325,210,275,160,C.blue,3);text(c,'局所の成分',213,230,18,C.blue);}
    footer(c,s.reveal?'端点を見せると、水平方向の移動を追える。':'再生して観察。確認すると隠れていた線の端が現れる。');
  });

  register('M10',(c,s)=>{
    title(c,'窓の長軸と、見かけの流れ');const v=val(s),w=80+260*v*v,h=285-150*v*v,x=320-w/2,y=200-h/2,shift=mod(time(s)*28,48);
    function stripes(alpha){c.save();c.globalAlpha=alpha;for(let k=-550;k<1050;k+=48)line(c,k+shift,-100,k+shift-500,400,C.teal,18);c.restore();}
    if(s.reveal){c.save();c.beginPath();c.rect(65,55,510,285);c.clip();stripes(.23);c.restore();}
    rect(c,x,y,w,h,'#e4ebeb');c.save();c.beginPath();c.rect(x,y,w,h);c.clip();stripes(1);c.restore();rect(c,x,y,w,h,null,C.ink,4);
    if(s.reveal){arrow(c,460,315,545,315,C.orange,3);text(c,'縞の実移動',500,343,18,C.orange);for(let k=-300;k<1000;k+=48){const xx=k+shift-y;if(xx>x&&xx<x+w)circle(c,xx,y,4,C.orange);}}
    footer(c,s.reveal?'同じ縞を窓で切り取ると、端の交点の動きが手がかりになる。':'縦長・横長で印象を比べる。下地は水平に移動。');
  });

  register('M11',(c,s)=>{
    title(c,'同じ回転を、異なる時間間隔で表示');const speed=.4+.45*val(s),t=time(s),a=t*TAU*speed,b=Math.floor(t*6)/6*TAU*speed;
    function wheel(x,ang,mark){circle(c,x,215,96,null,C.ink,4);for(let i=0;i<8;i++){const q=ang+i*TAU/8;line(c,x,215,x+91*Math.cos(q),215+91*Math.sin(q),i===0&&mark?C.orange:C.ink,i===0&&mark?6:4);}circle(c,x,215,10,C.ink);}
    wheel(170,a,true);wheel(470,b,s.reveal);text(c,'連続的に更新',170,70,20);text(c,'毎秒6コマ',470,70,20);text(c,`${(speed*60).toFixed(1)} 回転／分`,320,332,19,C.muted);
    if(s.reveal){arrow(c,105,100,220,100,C.orange,3);arrow(c,405,100,520,100,C.orange,3);text(c,'橙色は同じスポーク',320,354,18,C.orange);}
    footer(c,s.reveal?'右も元の回転方向は一定。目印で真の対応を確かめる。':'同形のスポークでは、別のスポークとの対応が曖昧になる。');
  });

  register('M12',(c,s)=>{
    title(c,'短く出る印と、動く点の横位置');
    const rate=.9+.4*val(s),t=time(s),phase=t*rate,cycle=Math.floor(phase/PI);
    let x=320+170*Math.sin(phase),flash=mod(phase,PI)<rate*.1;
    let record=flashFrames.get(c);
    if(!record||t<record.lastTime||rate!==record.rate||s.seed!==record.seed||s.variant!==record.variant){
      record={lastTime:t,rate,seed:s.seed,variant:s.variant,active:false,cycle:-1,captureX:320,hasCapture:false};
      flashFrames.set(c,record);
    }
    if(!s.reveal){
      if(flash&&(!record.active||cycle!==record.cycle)){record.captureX=x;record.hasCapture=true;record.cycle=cycle;}
      record.active=flash;record.lastTime=t;
    }
    let markX=record.captureX;
    if(s.reveal){x=markX;flash=true;line(c,x,95,x,305,C.orange,2,[6,5]);}
    line(c,130,168,510,168,C.pale,2);circle(c,x,168,16,C.teal);if(flash)rect(c,markX-9,223,18,45,C.orange);
    cross(c,320,318,6,C.ink);text(c,s.reveal?(record.hasCapture?'印が出たフレームの位置に戻す':'初期位置の比較（出現記録なし）'):'印は約2〜4秒ごとに短く表示',320,76,19,C.muted);
    footer(c,s.reveal?'出現フレームでは、点と印が同じ横位置で始まる。':'印は出現位置に留まり、点だけが移動を続ける。');
  });

  register('M13',(c,s)=>{
    title(c,'同じ速度の2つの長方形');const contrast=s.reveal?0:val(s),x=100+320*(1-Math.cos(time(s)*.65))/2;
    rect(c,70,70,500,260,'#abb3b6');for(let i=0;i<36;i++){const lum=Math.round(170+(i%2?65:-115)*contrast);rect(c,70+i*14,70,14,260,`rgb(${lum},${lum},${lum})`);}
    if(s.reveal)line(c,x+28,118,x+28,276,C.orange,3);
    rect(c,x,125,56,34,'#2d3c46');rect(c,x,235,56,34,'#eee2af');
    if(s.reveal){line(c,x,115,x,284,C.orange,2,[5,4]);line(c,x+56,115,x+56,284,C.orange,2,[5,4]);}
    footer(c,s.reveal?'先端も後端も、上下で常に同じ横座標。':'縞のコントラストを下げると同期が分かりやすい。');
  });

  register('M14',(c,s)=>{
    rect(c,0,0,640,400,'#c6c7c9');const t=time(s),idle=!s.running&&t===0;
    if(stopped(s)){title(c,'終了：無彩色の静止画面');cross(c,320,200,7,'#51565b');footer(c,'残像が消えるまで楽に視線を動かし、休む。');return;}
    title(c,idle?'再生後、中央を8秒以内で楽に見る':'紫の点の「抜けた位置」を観察');const gap=Math.floor(t/.27)%12;
    for(let i=0;i<12;i++){const a=i*TAU/12-PI/2,x=320+111*Math.cos(a),y=205+111*Math.sin(a);
      if(idle){circle(c,x,y,18,null,'#8e9297',2);continue;}
      if(i!==gap){const g=c.createRadialGradient(x,y,2,x,y,24);g.addColorStop(0,`rgba(173,77,163,${.35+.4*val(s)})`);g.addColorStop(1,'rgba(173,77,163,0)');circle(c,x,y,24,g);}
      if(s.reveal)circle(c,x,y,21,null,i===gap?'#45484d':'#a0a3a7',i===gap?3:1);
    }
    cross(c,320,205,7,'#3e4349');footer(c,s.reveal?'緑の点は描画せず、1か所を灰色の背景に戻している。':idle?'初期画面は配置だけ。再生時に紫の刺激を表示。':`あと ${Math.ceil(8-t)} 秒で無彩色画面へ。`);
  });

  register('M15',(c,s)=>{
    const end=stopped(s),showField=!s.reveal&&!end,t=time(s);title(c,end?'終了：静止した3つの点':'背景が動いても、3つの点は描き続ける');
    rect(c,85,55,470,285,showField?'#25354a':'#e7e9eb');
    if(showField){c.save();c.beginPath();c.rect(85,55,470,285);c.clip();c.translate(320,200);c.rotate(t*(.07+.18*val(s)));for(let x=-250;x<260;x+=29)for(let y=-250;y<260;y+=29)cross(c,x,y,4,'#62839e',2);c.restore();}
    [[215,140],[425,140],[320,285]].forEach(([x,y])=>{circle(c,x,y,6,'#e3c76d');if(s.reveal||end)circle(c,x,y,17,null,C.orange,2);});cross(c,320,200,7,showField?'#edf1f6':C.ink);
    footer(c,end?'背景を除去。消失の有無は診断や成績ではない。':s.reveal?'背景を隠し、点の固定座標を示す。':'8秒以内。長く見続けず、見えなくても延長しない。');
  });

  register('M16',(c,s)=>{
    title(c,'点の運動から円筒の奥行きが立ち上がる');const angle=.35+time(s)*(.3+.45*val(s)),seed=s.seed||2;
    const points=[];for(let i=0;i<160;i++){const a=rand(i,seed)*TAU+angle;points.push({x:320+145*Math.cos(a),y:76+246*rand(i+200,seed),z:Math.sin(a)});}
    points.sort((a,b)=>a.z-b.z);points.forEach(p=>circle(c,p.x,p.y,3.5,s.reveal?(p.z>0?C.orange:C.blue):C.teal));
    if(s.reveal){line(c,320,53,320,340,C.muted,2,[5,6]);c.beginPath();c.ellipse(320,330,145,18,0,0,TAU);c.strokeStyle=C.pale;c.lineWidth=2;c.stroke();text(c,'暖色＝手前　寒色＝奥',320,352,18);}
    footer(c,s.reveal?'色は生成モデルの前後。平面上の点に深さの手がかりを追加。':'同じ点の明るさだけでは、前後が曖昧になることもある。');
  });

  register('M17',(c,s)=>{
    title(c,'陰影のない回転人形：独自の簡略例');const a=.55+time(s)*(.35+.5*val(s));
    const pts={neck:[0,137,0],hip:[0,235,0],lh:[-86,173,20],rh:[78,158,-20],lf:[-55,321,35],rf:[52,313,-35]};
    function p(q){return [320+q[0]*Math.cos(a)+q[2]*Math.sin(a),q[1],-q[0]*Math.sin(a)+q[2]*Math.cos(a)];}
    const seg=[['neck','lh'],['neck','rh'],['hip','lf'],['hip','rf']].map(([u,v])=>[p(pts[u]),p(pts[v])]);seg.sort((x,y)=>x[1][2]-y[1][2]);
    seg.forEach(([u,v])=>line(c,u[0],u[1],v[0],v[1],s.reveal?(v[2]>0?C.orange:C.blue):C.ink,22));line(c,320,140,320,235,C.ink,34);circle(c,320,102,27,C.ink);
    if(s.reveal){text(c,'暖色＝手前　寒色＝奥',320,348,18);}
    line(c,205,337,435,337,C.pale,2);footer(c,s.reveal?'前後の色を加えた生成モデル。元の回転方向は一定。':'回転の見え方から、性格や「利き脳」は判定できない。');
  });

  register('M18',(c,s)=>{
    title(c,'手前の面は、どちらにも読める');const A=[[190,145],[360,145],[360,315],[190,315]],B=A.map(([x,y])=>[x+95,y-75]);
    if(s.reveal)polygon(c,val(s)<.5?A:B,'#dfb09a',null);
    [A,B].forEach(p=>polygon(c,p,null,C.ink,4));for(let i=0;i<4;i++)line(c,...A[i],...B[i],C.ink,4);
    if(s.reveal){const p=val(s)<.5?A:B;circle(c,p[0][0],p[0][1],7,C.orange);text(c,'選んだ面を強調',480,320,18,C.orange);}
    footer(c,s.reveal?'線の位置は同じ。色を付けた面が解釈の手がかりになる。':'固定された線画。どちらか一方だけが正解ではない。');
  });

  function vasePath(c){c.beginPath();c.moveTo(230,65);c.bezierCurveTo(235,95,260,105,261,124);c.bezierCurveTo(266,139,249,146,267,154);c.bezierCurveTo(274,158,265,164,261,170);c.bezierCurveTo(268,176,261,186,256,192);c.bezierCurveTo(259,217,238,228,235,258);c.bezierCurveTo(229,293,210,315,202,326);c.lineTo(438,326);c.bezierCurveTo(430,315,411,293,405,258);c.bezierCurveTo(402,228,381,217,384,192);c.bezierCurveTo(379,186,372,176,379,170);c.bezierCurveTo(375,164,366,158,373,154);c.bezierCurveTo(391,146,374,139,379,124);c.bezierCurveTo(380,105,405,95,410,65);c.closePath();}
  register('M19',(c,s)=>{
    title(c,'同じ境界が、壺と横顔の両方になる');const faces=s.reveal&&val(s)>=.5;
    rect(c,85,52,470,290,faces?'#79a8a8':C.ink);vasePath(c);c.fillStyle=s.reveal&&!faces?'#e1ab91':'#f1f1ec';c.fill();
    if(s.reveal){if(faces){circle(c,219,142,5,C.ink);circle(c,421,142,5,C.ink);text(c,'横顔',146,288,20,'#f5f7fa');text(c,'横顔',493,288,20,'#f5f7fa');}else text(c,'壺',320,258,25,C.ink);}
    footer(c,s.reveal?'図と地の割り当てを変える。境界曲線は変更しない。':'中央の白い部分と、左右の暗い部分を順に意識する。');
  });

  function duckPath(c){c.beginPath();c.moveTo(390,134);c.bezierCurveTo(350,109,308,117,280,135);c.lineTo(159,91);c.bezierCurveTo(135,86,130,105,159,120);c.lineTo(266,167);c.lineTo(146,157);c.bezierCurveTo(127,159,136,180,160,184);c.lineTo(264,194);c.bezierCurveTo(267,256,300,282,360,280);c.bezierCurveTo(407,279,432,255,444,234);c.bezierCurveTo(459,232,465,222,450,213);c.bezierCurveTo(444,171,423,150,390,134);c.closePath();}
  register('M20',(c,s)=>{
    title(c,'アヒル／ウサギ：同じ突起を読み替える');duckPath(c);c.fillStyle='#e9e9df';c.fill();c.strokeStyle=C.ink;c.lineWidth=4;c.stroke();circle(c,354,169,6,C.ink);line(c,432,236,417,239,C.ink,3);
    if(s.reveal){const rabbit=val(s)>=.5;line(c,160,103,265,146,C.orange,7);line(c,150,170,255,184,C.orange,7);arrow(c,150,300,200,202,C.orange,3);text(c,rabbit?'耳として読む':'くちばしとして読む',176,330,20,C.orange);text(c,rabbit?'ウサギ →':'← アヒル',415,310,20,C.teal);}
    footer(c,s.reveal?'色の付いた2本の部分が、両方の解釈に使われる。':'原典画像を使わない独自の簡略線画。見え方には個人差。');
  });

  register('M21',(c,s)=>{
    title(c,'階段の上側／下側を読み替える');const A=[[120,260],[120,218],[174,218],[174,176],[228,176],[228,134],[282,134],[282,92],[336,92]],B=A.map(([x,y])=>[x+130,y+65]);
    if(s.reveal){const flip=val(s)>=.5;for(let i=1;i<A.length-1;i+=2){const q=flip?i-1:i;polygon(c,[A[q],A[q+1],B[q+1],B[q]],flip?'#a8c8cc':'#e5b49e',null);}}
    [A,B].forEach(p=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.lineWidth=3;c.strokeStyle=C.ink;c.stroke();});for(let i=0;i<A.length;i++)line(c,...A[i],...B[i],C.ink,3);
    text(c,'A',96,263,22,C.orange);text(c,'B',489,158,22,C.teal);if(s.reveal)text(c,val(s)<.5?'面の候補を強調':'別の面の候補を強調',430,329,19);
    footer(c,'静止線画の奥行きの多義性。不可能階段とは区別する。');
  });

  register('M22',(c,s)=>{
    title(c,'大きな文字を読む／小さな文字を読む');const step=29+val(s)*10,x0=320-step*3,y0=87;
    for(let y=0;y<7;y++)for(let x=0;x<7;x++)if(x===0||x===6||y===3)text(c,'S',x0+x*step,y0+y*step,26,C.ink);
    if(s.reveal){line(c,x0,y0,x0,y0+6*step,C.orange,3,[5,5]);line(c,x0+6*step,y0,x0+6*step,y0+6*step,C.orange,3,[5,5]);line(c,x0,y0+3*step,x0+6*step,y0+3*step,C.orange,3,[5,5]);circle(c,x0,y0,22,null,C.teal,3);text(c,'全体 H',105,185,21,C.orange);text(c,'部分 S',535,185,21,C.teal);}
    footer(c,'反応時間は測定しない。全体優先は大きさや課題でも変わる。');
  });

  function token(c,i,x,y,r,changed){const k=changed?(i+1)%4:i%4;const color=[C.teal,C.blue,C.orange,'#987b45'][i%4];if(k===0)circle(c,x,y,r,color);else if(k===1)rect(c,x-r,y-r,r*2,r*2,color);else if(k===2)polygon(c,[[x,y-r-1],[x+r+1,y+r],[x-r-1,y+r]],color);else polygon(c,[[x,y-r-2],[x+r+2,y],[x,y+r+2],[x-r-2,y]],color);}
  function shelf(c,x,y,w,h,target,change,highlight){const cw=w/5,ch=h/4;rect(c,x,y,w,h,'#e8edf0',C.pale);for(let j=1;j<4;j++)line(c,x,y+j*ch,x+w,y+j*ch,'#b7c5cf',2);for(let i=0;i<20;i++){const xx=x+(i%5+.5)*cw,yy=y+(Math.floor(i/5)+.5)*ch;token(c,i,xx,yy,Math.min(cw,ch)*.23,change&&i===target);if(highlight&&i===target)circle(c,xx,yy,Math.min(cw,ch)*.4,null,C.orange,3);}}
  register('M23',(c,s)=>{
    title(c,'遮られる前後で、1つの記号が変わる');const target=((s.seed||1)*7+(s.variant||0)*3)%20;
    if(s.reveal){shelf(c,30,91,275,245,target,false,true);shelf(c,335,91,275,245,target,true,true);text(c,'前',167,64,20);text(c,'後',472,64,20);footer(c,'輪で囲んだ1個だけが違う。残る19個の描画は同じ。');return;}
    const d=2.8+val(s)*2.2,t=time(s),n=Math.floor(t/d),q=t%d,mask=Math.min(1,q/.5,(d-q)/.5);shelf(c,85,68,470,270,target,n%2===1,false);
    if(t>0&&mask<1){c.save();c.globalAlpha=1-mask;rect(c,85,68,470,270,'#b8c1c8');c.restore();}
    footer(c,'穏やかな遮蔽を挟む。確認すると2枚を並べて比較できる。');
  });

  register('M24',(c,s)=>{
    title(c,'白い点が中央の線を横切る回数を数える');const t=s.reveal?5:Math.min(time(s),10),rate=.6+.5*val(s);
    rect(c,65,60,510,280,'#26384a');line(c,320,75,320,325,'#7891a5',2,[6,7]);
    for(let i=0;i<4;i++){const x=320+205*Math.sin(t*rate+i*1.65),y=95+i*64;circle(c,x,y,12,'#edf2f4');circle(c,320+190*Math.sin(t*(rate+.2)+i*1.5+1.2),y+27,10,'#5b858f');}
    if(t>=3&&t<=7){const x=95+(t-3)/4*450,y=203;polygon(c,[[x,y-24],[x+24,y],[x,y+24],[x-24,y]],C.orange);if(s.reveal){circle(c,x,y,40,null,'#f2c0a3',3);arrow(c,112,280,530,280,'#f2c0a3',2);}}
    footer(c,s.reveal?'3〜7秒に橙色の菱形が通過。今は5秒の状態を表示。':time(s)>=10?'10秒で終了。確認して別の出来事を振り返る。':'初見の予期を完全には統制できないため、実験ではない。');
  });

  register('M25',(c,s)=>{
    title(c,'左の十字を見たまま、右の文字を意識する');cross(c,112,200,11,C.ink,3);const gap=28+val(s)*42;
    text(c,'R',455,123,34,C.ink);text(c,'R',455,270,34,C.ink);
    if(!s.reveal){text(c,'T',455-gap,270,34,C.ink);text(c,'H',455+gap,270,34,C.ink);}else{circle(c,455,123,29,null,C.orange,2);circle(c,455,270,29,null,C.orange,2);line(c,112,200,455,123,C.pale,2,[5,5]);line(c,112,200,455,270,C.pale,2,[5,5]);}
    footer(c,s.reveal?'上下とも同じR。周囲の文字を取り除いた。':'直接Rへ目を向けると、周辺視の比較ではなくなる。');
  });

  register('M26',(c,s)=>{
    title(c,'機械の部品が、顔に見えることがある');c.save();c.translate(320,200);c.rotate((val(s)-.5)*TAU);
    rect(c,-137,-125,274,250,'#dce3df',C.muted,4);
    [[-69,-48],[69,-48]].forEach(([x,y])=>{circle(c,x,y,31,'#a1b1b2',s.reveal?C.orange:C.ink,3);line(c,x-14,y,x+14,y,C.ink,5);});
    rect(c,-75,47,150,48,s.reveal?'#75a2a0':C.ink);for(let i=-55;i<=55;i+=22)line(c,i,56,i,87,'#cbd7d4',5);c.restore();
    if(s.reveal){text(c,'2つのねじ',118,80,19,C.orange);text(c,'通気口',521,315,19,C.teal);}
    footer(c,s.reveal?'部品の名前を変えても、顔らしい配置は残っている。':'目と口の画像は使わず、部品の配置だけで印象を作る。');
  });

  register('M27',(c,s)=>{
    title(c,'自動運動：固定点と知覚の報告例（模式図）');rect(c,50,82,250,235,'#1d2935');const alpha=s.reveal?1:val(s)*.65;
    c.save();c.globalAlpha=alpha;grid(c,65,97,220,205,25,'#667b8d');c.restore();circle(c,175,200,4,'#b9c3cb');
    rect(c,340,82,250,235,'#e9edf1',C.pale);c.beginPath();c.moveTo(465,200);c.bezierCurveTo(487,169,410,140,426,193);c.bezierCurveTo(440,228,495,250,514,205);c.bezierCurveTo(539,167,467,165,482,218);c.setLineDash([5,6]);c.strokeStyle=C.orange;c.lineWidth=3;c.stroke();c.setLineDash([]);
    text(c,'固定された点',175,341,19);text(c,'知覚されうる軌跡の例',465,341,18);
    if(s.reveal){cross(c,175,200,16,'#e3ac8f');text(c,'位置は一定',175,285,18,'#c8d4df');}
    footer(c,'右の軌跡は説明用。暗室や長時間の凝視は求めない。');
  });

  register('M28',(c,s)=>{
    title(c,'クロノスタシス：時間の伸びの模式図');const start=145,unit=110,stretch=25+val(s)*55;
    text(c,'物理時間',75,126,18);text(c,'主観の例',75,236,18);
    line(c,start,142,585,142,C.ink,2);line(c,start-stretch,272,585,272,C.ink,2);
    for(let i=0;i<4;i++){line(c,start+i*unit,127,start+i*unit,157,C.ink,3);text(c,`${i}秒`,start+i*unit,101,18,C.muted);}
    for(let i=0;i<4;i++){const x=i===0?start-stretch:start+i*unit;line(c,x,257,x,287,C.ink,3);}
    rect(c,start,163,unit,25,'#8bb3b2');rect(c,start-stretch,293,unit+stretch,25,'#dfab8f');text(c,'同じ1秒',start+unit/2,204,19,C.teal);text(c,'最初の区間を長く感じる',305,337,19,C.orange);
    arrow(c,start-stretch,70,start,70,C.orange,2);text(c,'視線移動',80,50,18,C.muted);
    if(s.reveal){line(c,start,115,start,324,C.teal,2,[5,5]);line(c,start+unit,115,start+unit,324,C.teal,2,[5,5]);}
    footer(c,'上段は等間隔。下段の伸びは説明用で、実測値ではない。');
  });

  function grating(c,x,y,r,vertical,color,alpha=1){c.save();c.globalAlpha=alpha;c.beginPath();c.arc(x,y,r,0,TAU);c.clip();rect(c,x-r,y-r,r*2,r*2,'#e2e8ed');for(let d=-r;d<=r;d+=16)vertical?rect(c,x+d,y-r,7,r*2,color):rect(c,x-r,y+d,r*2,7,color);c.restore();}
  register('M29',(c,s)=>{
    title(c,'両眼視野闘争：分離提示の模式図');grating(c,185,132,66,true,C.teal);grating(c,455,132,66,false,C.orange);text(c,'左眼への入力',185,51,19);text(c,'右眼への入力',455,51,19);
    const q=(Math.sin(time(s)*(.35+.35*val(s)))+1)/2;grating(c,320,280,54,true,C.teal);grating(c,320,280,54,false,C.orange,q);
    arrow(c,185,205,268,253,C.muted,2);arrow(c,455,205,372,253,C.muted,2);text(c,'知覚の交替・混合を模した表示',320,350,18);
    if(s.reveal){rect(c,94,66,182,132,null,C.blue,2);rect(c,364,66,182,132,null,C.blue,2);text(c,'同時に一定',110,298,18,C.blue);text(c,'入力は変えない',524,298,18,C.blue);}
    footer(c,'左右眼へ実際には分離しない。下段の変化は模式アニメ。');
  });

  register('M30',(c,s)=>{
    title(c,'ランダムドット：左右の対応の模式図');const N=28,cell=7,xs=[72,372],y=92,shift=1+Math.round(val(s)*2),seed=s.seed||7;
    const bit=(x,y,extra=0)=>rand(y*53+x,seed+extra)>.5;
    for(let side=0;side<2;side++)for(let yy=0;yy<N;yy++)for(let xx=0;xx<N;xx++){
      let sx=xx,extra=0;
      if(side===1&&yy>=8&&yy<20){if(xx>=8+shift&&xx<20+shift)sx=xx-shift;else if(xx>=8&&xx<8+shift)extra=31;}
      const b=bit(sx,yy,extra);rect(c,xs[side]+xx*cell,y+yy*cell,cell,cell,b?'#334854':'#e8edef');
    }
    text(c,'左眼用の画像',170,63,19);text(c,'右眼用の画像',470,63,19);
    if(s.reveal){rect(c,xs[0]+56,y+56,84,84,null,C.orange,3);rect(c,xs[1]+56+shift*cell,y+56,84,84,null,C.orange,3);const yy=y+12.5*cell,xx=xs[0]+12.5*cell,xx2=xs[1]+(12.5+shift)*cell;circle(c,xx,yy,7,C.orange);circle(c,xx2,yy,7,C.orange);line(c,xx,yy,xx2,yy,C.orange,2,[4,5]);text(c,`中央だけ ${shift*cell} px の対応ずれ`,320,328,20,C.orange);}
    else text(c,'この画面は左右眼へ分離していない',320,328,19,C.muted);
    footer(c,'確認で対応を可視化。無理な裸眼立体視を求めない。');
  });

  register('M31',(c,s)=>{
    title(c,'プルフリッヒ効果：時間差 → 位置差（模式図）');const t=time(s)+.8,delay=.1+.4*val(s),x=320+175*Math.sin(t*.85),old=320+175*Math.sin((t-delay)*.85);
    line(c,120,102,520,102,C.pale,3);circle(c,x,102,12,C.ink);text(c,'平面上の物体',84,72,18,C.ink,'left');
    line(c,120,181,520,181,C.pale,2);line(c,120,241,520,241,C.pale,2);circle(c,x,181,11,C.teal);circle(c,old,241,11,C.orange);text(c,'先の信号',92,181,18,C.teal,'right');text(c,'遅れた信号',92,241,18,C.orange,'right');
    if(s.reveal){line(c,x,117,x,258,C.teal,2,[4,4]);line(c,old,223,old,258,C.orange,2,[4,4]);arrow(c,old,270,x,270,C.orange,2);}
    c.beginPath();c.ellipse(320,318,134,18,0,0,TAU);c.strokeStyle=C.muted;c.lineWidth=2;c.setLineDash([5,5]);c.stroke();c.setLineDash([]);circle(c,320+134*Math.sin(t*.85),318+18*Math.cos(t*.85),6,C.blue);text(c,'奥行き軌道の知覚例',320,352,18,C.muted);
    footer(c,'模式図。眼ごとの減光や立体提示は行っていない。');
  });

  function lattice(c,x,y,w,h,ang,which=2){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();rect(c,x,y,w,h,'#e5ebeb');c.translate(x+w/2,y+h/2);for(let layer=0;layer<2;layer++){if(which<2&&layer!==which)continue;c.save();c.rotate(layer?ang:0);c.strokeStyle=layer?'#507d81':'#52636d';c.lineWidth=2;for(let a=-550;a<550;a+=9){c.beginPath();c.moveTo(a,-500);c.lineTo(a,500);c.stroke();}c.restore();}c.restore();}
  register('M32',(c,s)=>{
    title(c,'2枚の格子から現れる大きな縞');const a=(1+val(s)*13)*PI/180;
    if(s.reveal){lattice(c,22,95,184,235,a,0);lattice(c,228,95,184,235,a,1);lattice(c,434,95,184,235,a,2);text(c,'格子 A',114,65,20);text(c,'格子 B',320,65,20);text(c,'重ね合わせ',526,65,20);}
    else lattice(c,70,61,500,285,a,2);
    footer(c,s.reveal?'大きな縞は重ね合わせで生じる。両眼視は必要ない。':`格子の角度差 ${(a*180/PI).toFixed(1)}°。静止した2枚の直線群。`);
  });

  Object.assign(window.ILLUSION_RENDERERS || (window.ILLUSION_RENDERERS = {}), R);
})();
