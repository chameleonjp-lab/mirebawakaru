import {
  TAU,
  rad,
  INK,
  ACCENT,
  rgb,
  gray,
  line,
  rect,
  circle,
  path,
  rotate,
  distance,
  polygonArea,
  drawPrimitive,
  drawCandidates,
} from "./common.js";
import { colorPredicate } from "../rules.js";
const C = [120, 120],
  cy = 120;
const stripes = (vertical, step = 16, stroke = INK, width = 6) =>
  Array.from({ length: 15 }, (_, i) =>
    vertical
      ? line([16 + i * step, 35], [16 + i * step, 210], stroke, width)
      : line([15, 38 + i * step], [225, 38 + i * step], stroke, width),
  );
const rays = (origin = [120, 120], n = 20) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i * Math.PI) / n;
    return line(
      [origin[0] - 260 * Math.cos(a), origin[1] - 260 * Math.sin(a)],
      [origin[0] + 260 * Math.cos(a), origin[1] + 260 * Math.sin(a)],
      "#a1abae",
      1,
    );
  });
function wavy(radius) {
  return Array.from({ length: 241 }, (_, i) => {
    const a = (i * TAU) / 240,
      r = radius + 2 * Math.sin(a * 12);
    return [120 + r * Math.cos(a), 120 + r * Math.sin(a)];
  });
}
function checkers(vertical = false) {
  const bg = [];
  const w = vertical ? 6 : 20,
    h = vertical ? 20 : 6;
  for (let y = 34; y < 208; y += h)
    for (let x = 14; x < 226; x += w)
      bg.push(
        rect(
          x,
          y,
          w,
          h,
          (Math.floor((x - 14) / w) + Math.floor((y - 34) / h)) % 2
            ? "#fff"
            : "#24343c",
        ),
      );
  return bg;
}
/** Build the final geometry, including contextual decoration tied to stable choice IDs. */
export function makeGeometry(id, value, index, fillRgb) {
  const g = {
    background: [],
    targets: [],
    guides: [],
    fillRgb: fillRgb ? [...fillRgb] : undefined,
  };
  const bg = g.background,
    t = g.targets;
  const v = value,
    i = index;
  switch (id) {
    case "Q01": {
      const a = [60, 120],
        b = [60 + v, 120];
      t.push(line(a, b, INK, 5));
      for (const [j, p] of [a, b].entries())
        for (const sign of [-1, 1])
          bg.push(
            line(
              p,
              [
                p[0] +
                  (j ? -1 : 1) *
                    ([
                      [1, 1],
                      [-1, -1],
                      [1, -1],
                      [-1, 1],
                    ][i][j] *
                      19),
                120 + sign * 19,
              ],
              INK,
              3,
            ),
          );
      break;
    }
    case "Q02": {
      const y = [76, 102, 140, 172][i];
      g.targetY = y;
      t.push(line([60, y], [60 + v, y], INK, 7));
      bg.push(
        line([100, 35], [20, 210], "#75878b", 2),
        line([140, 35], [220, 210], "#75878b", 2),
      );
      for (let y = 55; y < 205; y += 24) {
        const d = (y - 35) * 0.46;
        bg.push(line([100 - d, y], [140 + d, y], "#b0b8b8", 1));
      }
      break;
    }
    case "Q03": {
      const r = [20, 10, 8, 17][i],
        orbit = [66, 46, 45, 63][i];
      for (let k = 0; k < 8; k++)
        bg.push(
          circle(
            120 + orbit * Math.cos((k * TAU) / 8),
            120 + orbit * Math.sin((k * TAU) / 8),
            r,
            "#dce2df",
            "#637471",
            1.5,
          ),
        );
      t.push(circle(120, 120, v, "#303f44", null));
      g.guides.push(circle(120, 120, 2, "#fff", null));
      break;
    }
    case "Q04":
      bg.push(circle(120, 120, [39, 76, 48, 66][i], null, INK, 2));
      t.push(circle(120, 120, v, INK, null));
      break;
    case "Q05": {
      const angle = rad(80),
        outer = Math.sqrt(v / ((angle * (1 - 0.65 ** 2)) / 2)),
        inner = outer * 0.65;
      const sector = {
        kind: "sector",
        x: 120 + [-4, 3, -3, 4][i],
        y: 215,
        outer,
        inner,
        angle,
        start: rad(-130),
        fill: "#b9c9c1",
        stroke: INK,
        width: 1.5,
      };
      g.sector = sector;
      t.push(sector);
      break;
    }
    case "Q06": {
      const a = [72, 168],
        b = i % 2 ? [72 + v, 168] : [72, 168 - v];
      t.push(line(a, b, INK, 5));
      bg.push(
        i % 2
          ? line([72, 65], [72, 168], "#82938c", 2)
          : line([30, 168], [174, 168], "#82938c", 2),
      );
      g.guides.push(
        circle((a[0] + b[0]) / 2 + 8, (a[1] + b[1]) / 2, 2, ACCENT, null),
      );
      break;
    }
    case "Q07": {
      t.push(
        line([55, 120], [55 + v, 120], INK, 1.5),
        line([55, 103], [55, 137], INK, 4),
        line([55 + v, 103], [55 + v, 137], INK, 4),
      );
      for (let j = 1; j < [4, 10, 6, 2][i]; j++) {
        const x = 55 + (v * j) / [4, 10, 6, 2][i];
        bg.push(line([x, 109], [x, 131], INK, 2));
      }
      break;
    }
    case "Q08": {
      const a = [76, 163],
        b = [76 + v * Math.cos(rad(-50)), 163 + v * Math.sin(rad(-50))];
      t.push(line(a, b, INK, 5));
      bg.push(
        path(
          [
            [30, 64],
            [158 + i * 8, 64],
            [210, 186],
            [70, 186],
          ],
          "#83938d",
          2,
          null,
          true,
        ),
        line(b, [210, 186], "#83938d", 2),
      );
      break;
    }
    case "Q09": {
      const s = Math.sqrt(v / 9900),
        angle = [-65, 0, -35, 18][i];
      g.tableAngle = angle;
      const pts = [
        [-70, -45],
        [40, -45],
        [70, 45],
        [-40, 45],
      ].map(([x, y]) => rotate([120 + x * s, 112 + y * s], angle, [120, 112]));
      for (const p of pts) bg.push(line(p, [p[0], p[1] + 43], "#6c7d72", 5));
      t.push(path(pts, INK, 1.5, "#d1ddd2", true));
      break;
    }
    case "Q10": {
      t.push(
        line([42, 166], [103, 124], INK, 4),
        line([137, 100 + v], [202, 100 - (65 * 42) / 61 + v], INK, 4),
      );
      g.join = { left: [103, 124], right: [137, 100 + v], slope: -42 / 61 };
      // The exact continuation at x=137 is 124-34*42/61.
      t[1].a[1] = 124 - (34 * 42) / 61 + v;
      t[1].b[1] = 124 - ((202 - 103) * 42) / 61 + v;
      g.join.right = t[1].a;
      bg.push(rect(103, 40, 34, 165, "#c7d0ca", "#87998d"));
      break;
    }
    case "Q11": {
      for (let j = 0; j < 2; j++) {
        const a = [32, 92 + j * 50],
          ang = rad(-10 + j * v),
          b = [208, a[1] + 176 * Math.tan(ang)];
        t.push(line(a, b, INK, 3));
        for (let k = 1; k < 8; k++) {
          const x = 32 + k * 22,
            y = a[1] + k * 22 * Math.tan(ang),
            s = j ? 1 : -1;
          bg.push(line([x - 9, y - s * 10], [x + 9, y + s * 10], INK, 1.5));
        }
      }
      break;
    }
    case "Q12":
      g.path = Array.from({ length: 101 }, (_, j) => [
        50 + j * 1.4,
        120 + v * 4 * (j / 100) * (1 - j / 100),
      ]);
      t.push(path(g.path, INK, 4));
      bg.push(...rays([120, 145]));
      break;
    case "Q13":
      t.push(rect(120 - 38 * v, 82, 76 * v, 76, null, INK, 3));
      bg.push(...rays([30, 198], 36));
      break;
    case "Q14": {
      const slope = Math.tan(rad(v));
      t.push(
        line([22, 120 - 98 * slope], [218, 120 + 98 * slope], "#858585", 4),
      );
      for (let r = -2; r <= 2; r++)
        for (let k = -1; k < 6; k++) {
          const x = 22 + k * 44 + (r % 2 ? 22 : 0),
            y = 120 + r * 33;
          const pts = [
            [x, y + 2],
            [x + 44, y + 2],
            [x + 44, y + 31],
            [x, y + 31],
          ].map(([px, py]) => [px, py + (px - 120) * slope]);
          bg.push(path(pts, null, 0, k % 2 ? "#fff" : "#151515", true));
        }
      break;
    }
    case "Q15": {
      g.path = Array.from({ length: 241 }, (_, j) => {
        const a = (j * TAU) / 240,
          r = 53 + (v * j) / 240;
        return [120 + r * Math.cos(a), 120 + r * Math.sin(a)];
      });
      t.push(path(g.path, INK, 3));
      for (const r of [28, 79])
        bg.push(circle(120, 120, r, null, "#bac6c0", 8));
      for (let k = 0; k < 72; k++) {
        const a = (k * TAU) / 72,
          r = 53 + (v * k) / 72,
          p = [120 + r * Math.cos(a), 120 + r * Math.sin(a)],
          d = a + 1;
        bg.push(
          line(
            [p[0] - 5 * Math.cos(d), p[1] - 5 * Math.sin(d)],
            [p[0] + 5 * Math.cos(d), p[1] + 5 * Math.sin(d)],
            "#9faeab",
            4,
          ),
        );
      }
      g.guides.push(circle(...g.path[0], 3, ACCENT, null));
      break;
    }
    case "Q16": {
      for (let x = -50; x <= 50; x += 12)
        t.push(
          line(rotate([120 + x, 77], v), rotate([120 + x, 163], v), INK, 4),
        );
      bg.push(
        ...stripes(true, 15, "#80928d", 5).map((p) => ({
          ...p,
          a: rotate(p.a, [18, -20, 24, -16][i]),
          b: rotate(p.b, [18, -20, 24, -16][i]),
        })),
        circle(120, 120, 64, "#fff", null),
      );
      break;
    }
    case "Q17":
      g.fillRgb = [v, v, v];
      bg.push(rect(15, 35, 210, 175, gray([230, 30, 80, 180][i])));
      t.push(rect(85, 85, 70, 70, gray(v)));
      break;
    case "Q18": {
      const alpha = [0.2, 0.3, 0.1, 0.25][i];
      g.fillRgb = [v, v, v];
      g.shadowAlpha = alpha;
      g.baseGray = v / (1 - alpha);
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 5; c++)
          bg.push(
            rect(
              20 + c * 40,
              40 + r * 40,
              40,
              40,
              (r + c) % 2 ? "#888" : "#e5e5e5",
            ),
          );
      bg.push(
        path(
          [
            [80, 40],
            [215, 40],
            [215, 200],
            [110, 200],
          ],
          null,
          0,
          `rgba(0,0,0,${alpha})`,
          true,
        ),
      );
      // Store the post-composite target explicitly; the same opaque fill is used in original and proof.
      t.push(rect(100, 80, 40, 40, gray(v)));
      g.guides.push(circle(120, 100, 3, "#fff", INK, 1));
      break;
    }
    case "Q19": {
      g.profile = Array.from({ length: 201 }, (_, x) =>
        Math.round(
          64 +
            140 * Math.max(0, Math.min(1, (x - 40) / 120)) +
            (v && x >= 136 && x <= 143 ? 22 : 0),
        ),
      );
      for (let x = 0; x < 200; x++)
        t.push(rect(20 + x, 60, 1, 120, gray(g.profile[x])));
      g.addedBand = !!v;
      g.guides.push(line([159, 47], [159, 57], ACCENT, 2));
      break;
    }
    case "Q20": {
      bg.push(rect(20, 40, 200, 160, "#111"));
      for (let x = 40; x <= 200; x += 40)
        bg.push(line([x, 40], [x, 200], "#929292", 6));
      for (let y = 60; y <= 180; y += 40)
        bg.push(line([20, y], [220, y], "#929292", 6));
      for (let x = 40; x <= 200; x += 40)
        for (let y = 60; y <= 180; y += 40)
          bg.push(circle(x, y, 6, "#fff", null));
      if (v) t.push(circle(120, 100, 3, "#111", null));
      break;
    }
    case "Q21": {
      g.fillRgb = [v, v, v];
      t.push(rect(20, 45, 200, 150, gray(v)));
      const d = [35, -35, 28, -28][i];
      bg.push(
        {
          ...rect(105, 45, 15, 150, null),
          gradient: [
            [0, gray(v)],
            [1, gray(v - d)],
          ],
        },
        {
          ...rect(120, 45, 15, 150, null),
          gradient: [
            [0, gray(v + d)],
            [1, gray(v)],
          ],
        },
      );
      g.foregroundBackground = true;
      g.guides.push(circle(65, 120, 3, "#fff", INK, 1));
      break;
    }
    case "Q22":
      bg.push(
        ...stripes(
          false,
          17,
          ["#6095cc", "#dcb55f", "#d1719a", "#4f9b87"][i],
          10,
        ),
      );
      for (let y = 65; y <= 167; y += 34)
        t.push(rect(82, y, 76, 17, rgb(fillRgb)));
      break;
    case "Q23":
      t.push(path(wavy(65), null, 0, rgb(fillRgb), true));
      bg.push(
        path(wavy(68), "#6c3788", 3, null, true),
        path(wavy(65), "#e99c3b", 3, null, true),
      );
      g.foregroundBackground = true;
      break;
    case "Q24": {
      t.push(rect(89, 89, 62, 62, rgb(fillRgb)));
      for (let k = 0; k < 12; k++) {
        const a = (k * TAU) / 12;
        bg.push(
          line(
            [120 + 46 * Math.cos(a), 120 + 46 * Math.sin(a)],
            [120 + 73 * Math.cos(a), 120 + 73 * Math.sin(a)],
            "#209bb8",
            2,
          ),
          line(
            [120 + 73 * Math.cos(a), 120 + 73 * Math.sin(a)],
            [120 + 90 * Math.cos(a), 120 + 90 * Math.sin(a)],
            INK,
            2,
          ),
        );
      }
      break;
    }
    case "Q25":
      bg.push(
        rect(15, 35, 210, 175, ["#d4c080", "#7ab7b9", "#a2b4d4", "#d299ad"][i]),
      );
      t.push(rect(83, 83, 74, 74, rgb(fillRgb)));
      break;
    case "Q26": {
      const pts = [
        [120, 63],
        [57, 174],
        [183, 174],
      ];
      for (const [j, p] of pts.entries()) {
        bg.push(circle(...p, 23, "#171717", null));
        const others = pts.filter((_, k) => k !== j),
          a = others.map((q) => Math.atan2(q[1] - p[1], q[0] - p[0]));
        let mid = Math.atan2(
          Math.sin(a[0]) + Math.sin(a[1]),
          Math.cos(a[0]) + Math.cos(a[1]),
        );
        const wedge = [
          p,
          ...Array.from({ length: 31 }, (_, k) => [
            p[0] + 24 * Math.cos(mid - rad(30) + k * rad(2)),
            p[1] + 24 * Math.sin(mid - rad(30) + k * rad(2)),
          ]),
        ];
        bg.push(path(wedge, null, 0, "#fff", true));
      }
      if (v) t.push(line([82, 174], [158, 174], "#555", 1.5));
      break;
    }
    case "Q27":
      for (let k = 0; k < 12; k++) {
        const a = (k * TAU) / 12;
        bg.push(
          line(
            [120 + 35 * Math.cos(a), 120 + 35 * Math.sin(a)],
            [120 + 85 * Math.cos(a), 120 + 85 * Math.sin(a)],
            INK,
            2,
          ),
        );
      }
      if (v) t.push(circle(120, 120, 28, null, "#555", 1.5));
      break;
    default:
      if (/^Q(28|29|30|31|32|33)$/.test(id)) {
        g.motionValue = v;
        g.motionIndex = i;
        g.targets = [circle(120, 120, 1, INK, null)];
        if (id === "Q32")
          g.constraints = {
            speed: 40,
            radius: 6,
            lineWidth: 2,
            duration: 80,
            delay: 600,
            period: 1800,
          };
        break;
      }
      throw new Error(`描画未登録 ${id}`);
  }
  return g;
}
export function metricFromGeometry(id, g) {
  const t = g.targets;
  switch (id) {
    case "Q01":
    case "Q02":
    case "Q06":
    case "Q08":
      return distance(t[0].a, t[0].b);
    case "Q03":
    case "Q04":
      return t[0].r;
    case "Q05":
      return (g.sector.angle * (g.sector.outer ** 2 - g.sector.inner ** 2)) / 2;
    case "Q07":
      return distance(t[1].a, t[2].a);
    case "Q09":
      return polygonArea(t[0].points);
    case "Q10":
      return (
        g.join.right[1] -
        (g.join.left[1] + (g.join.right[0] - g.join.left[0]) * g.join.slope)
      );
    case "Q11":
      return (
        ((Math.atan2(t[1].b[1] - t[1].a[1], t[1].b[0] - t[1].a[0]) -
          Math.atan2(t[0].b[1] - t[0].a[1], t[0].b[0] - t[0].a[0])) *
          180) /
        Math.PI
      );
    case "Q12":
      return g.path[50][1] - (g.path[0][1] + g.path.at(-1)[1]) / 2;
    case "Q13":
      return t[0].w / t[0].h;
    case "Q14":
      return (
        (Math.atan2(t[0].b[1] - t[0].a[1], t[0].b[0] - t[0].a[0]) * 180) /
        Math.PI
      );
    case "Q15":
      return distance(g.path.at(-1), C) - distance(g.path[0], C);
    case "Q16":
      return (
        (Math.atan2(-(t[0].b[0] - t[0].a[0]), t[0].b[1] - t[0].a[1]) * 180) /
        Math.PI
      );
    case "Q17":
    case "Q18":
    case "Q21":
      return g.fillRgb[0];
    case "Q19":
      return Number(g.addedBand);
    case "Q20":
    case "Q26":
    case "Q27":
      return t.length;
    case "Q22":
      return Number(colorPredicate("red_category", g.fillRgb));
    case "Q23":
      return Number(colorPredicate("neutral_white", g.fillRgb));
    case "Q24":
      return Number(colorPredicate("center_fill", g.fillRgb));
    case "Q25":
      return Number(colorPredicate("blue_category", g.fillRgb));
    default:
      return g.motionValue;
  }
}
export function proofGeometry(id, g) {
  return g;
}
export function buildStaticScene(instance) {
  return {
    questionId: instance.questionId,
    candidates: instance.choices.map((c) => ({
      choiceId: c.choiceId,
      geometry: c.geometry,
    })),
  };
}
export function renderStatic(
  ctx,
  scene,
  { reveal = false, layout, overlay = false } = {},
) {
  drawCandidates(ctx, scene.candidates, layout, (c, i) => {
    const g = c.geometry,
      id = scene.questionId;
    if (reveal) {
      ctx.fillStyle = ["Q17", "Q18", "Q21", "Q22", "Q25"].includes(id)
        ? "#bcbcbc"
        : "#fff";
      ctx.fillRect(8, 32, 224, 182);
    }
    if (!reveal && !g.foregroundBackground)
      g.background.forEach((p) => drawPrimitive(ctx, p));
    ctx.save();
    if (reveal && id === "Q02") ctx.translate(0, 120 - g.targetY);
    if (reveal && ["Q06", "Q08"].includes(id)) {
      const p = g.targets[0],
        a = Math.atan2(p.b[1] - p.a[1], p.b[0] - p.a[0]);
      ctx.translate(55, 120);
      ctx.rotate(-a);
      ctx.translate(-p.a[0], -p.a[1]);
    }
    if (reveal && id === "Q09") {
      ctx.translate(120, 112);
      ctx.rotate(-rad(g.tableAngle));
      ctx.translate(-120, -112);
    }
    g.targets.forEach((p) => drawPrimitive(ctx, p));
    ctx.restore();
    if (!reveal && g.foregroundBackground)
      g.background.forEach((p) => drawPrimitive(ctx, p));
    if (!reveal) g.guides.forEach((p) => drawPrimitive(ctx, p));
    if (reveal) {
      if (["Q01", "Q02", "Q06", "Q07", "Q08"].includes(id))
        drawPrimitive(ctx, line([55, 70], [55, 180], ACCENT, 1));
      if (["Q03", "Q04"].includes(id))
        drawPrimitive(
          ctx,
          line(
            [120 - g.targets[0].r, 120],
            [120 + g.targets[0].r, 120],
            ACCENT,
            1,
          ),
        );
      if (id === "Q10")
        drawPrimitive(
          ctx,
          line([42, 166], [202, 124 - ((202 - 103) * 42) / 61], ACCENT, 1),
        );
      if (id === "Q11")
        for (const p of g.targets)
          drawPrimitive(
            ctx,
            line(
              p.a,
              [
                225,
                p.a[1] +
                  ((225 - p.a[0]) * (p.b[1] - p.a[1])) / (p.b[0] - p.a[0]),
              ],
              ACCENT,
              1,
            ),
          );
      if (["Q12", "Q14"].includes(id))
        drawPrimitive(ctx, line([20, 120], [220, 120], ACCENT, 1));
      if (id === "Q13") {
        const p = g.targets[0];
        drawPrimitive(
          ctx,
          line([p.x, p.y + 12], [p.x + 12, p.y + 12], ACCENT, 1),
        );
        drawPrimitive(
          ctx,
          line([p.x + 12, p.y], [p.x + 12, p.y + 12], ACCENT, 1),
        );
      }
      if (id === "Q16")
        drawPrimitive(ctx, line([120, 50], [120, 190], ACCENT, 1));
      if (id === "Q19")
        drawPrimitive(
          ctx,
          path(
            g.profile.map((v, x) => [20 + x, 216 - (v - 64) * 0.2]),
            ACCENT,
            1.5,
          ),
        );
    }
  });
  if (overlay && ["Q03", "Q05", "Q09"].includes(scene.questionId)) {
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 28, layout.width, layout.height - 28);
    ctx.translate(layout.width / 2 - 120, layout.height / 2 - 120);
    scene.candidates.forEach((c, i) => {
      ctx.save();
      const g = c.geometry;
      if (scene.questionId === "Q09") {
        ctx.translate(120, 112);
        ctx.rotate(-rad(g.tableAngle));
        ctx.translate(-120, -112);
      }
      if (scene.questionId === "Q05") ctx.translate(120 - g.sector.x, 0);
      g.targets.forEach((p) =>
        drawPrimitive(ctx, {
          ...p,
          fill: null,
          stroke: ["#197b70", "#bd5a3b", "#3d67a2", "#8c548c"][i],
          width: 1.5,
        }),
      );
      ctx.restore();
    });
    ctx.restore();
  }
}
export { checkers };
