import {
  TAU,
  rad,
  INK,
  ACCENT,
  line,
  rect,
  circle,
  path,
  drawPrimitive,
  drawCandidates,
} from "./common.js";
import { checkers } from "./static.js";
export const frameGapExceeded = (previous, current) => current - previous > 100;
export const createPresentation = () => ({ first: null, current: null });
const directions = { 1: [1, 0], 2: [0, 1], 3: [-1, 0], 4: [0, -1] };
export function buildMotionFrame(
  instance,
  elapsedMs,
  presentation = createPresentation(),
) {
  const id = instance.questionId,
    t = elapsedMs / 1000;
  let current = presentation.current,
    start = null,
    flash = false,
    cycle = null;
  if (id === "Q32" && elapsedMs >= 600) {
    cycle = Math.floor((elapsedMs - 600) / 1800);
    start = current?.cycle === cycle ? current.start : elapsedMs;
    flash = elapsedMs - start < 80;
  }
  const candidates = instance.choices.map((c) => {
    const v = c.geometry.motionValue,
      i = c.geometry.motionIndex;
    const f = { choiceId: c.choiceId, elapsedMs, index: i };
    switch (id) {
      case "Q28":
        return { ...f, angle: v * t };
      case "Q29":
      case "Q30":
        return {
          ...f,
          dx: v * Math.sin((TAU * t) / 3),
          frameDx: 12 * Math.sin((TAU * t) / 3),
        };
      case "Q31": {
        const [vx, vy] = directions[v],
          phase = elapsedMs % 4000,
          travel = (phase / 1000) * 20 - 40;
        return {
          ...f,
          dx: vx * t * 20,
          dy: vy * t * 20,
          markerX: 120 + vx * travel,
          markerY: 120 + vy * travel,
          visible: phase >= 200 && phase <= 3800,
          phase,
          vector: [vx, vy],
        };
      }
      case "Q32": {
        // One circular trajectory avoids resets. The flash is a fixed line captured at the actual submitted frame.
        const x = 120 + 60 * Math.sin((40 / 60) * t),
          y = 120 - 60 * Math.cos((40 / 60) * t);
        const a = (start ?? elapsedMs) / 1000,
          markX = 120 + 60 * Math.sin((40 / 60) * a) + v,
          markY = 120 - 60 * Math.cos((40 / 60) * a);
        return { ...f, x, y, markX, markY, offset: v, radius: 6, lineWidth: 2 };
      }
      case "Q33":
        return {
          ...f,
          x: 40 + v * t,
          y: 120,
          wrappedX: 40 + (v * (elapsedMs % 9000)) / 1000,
          cycle: Math.floor(elapsedMs / 9000),
          resetting: elapsedMs % 9000 >= 8000,
        };
      default:
        throw new Error(`未知の動く問題 ${id}`);
    }
  });
  return {
    questionId: id,
    elapsedMs,
    candidates,
    flash,
    presentationStart: start,
    presentationCycle: cycle,
  };
}
export function commitPresentation(state, frame) {
  if (frame.questionId !== "Q32" || !frame.flash) return;
  if (state.current?.cycle !== frame.presentationCycle) {
    state.current = {
      start: frame.presentationStart,
      cycle: frame.presentationCycle,
    };
    if (!state.first) state.first = structuredClone(frame);
  }
}
export function renderMotion(
  ctx,
  frame,
  { layout, reveal = false, from = null } = {},
) {
  drawCandidates(ctx, frame.candidates, layout, (c, i) => {
    const draw = (p) => drawPrimitive(ctx, p),
      id = frame.questionId;
    if (id === "Q28") {
      ctx.save();
      ctx.translate(120, 120);
      ctx.rotate(rad(c.angle));
      for (let k = 0; k < 64; k++)
        draw({
          kind: "sector",
          x: 0,
          y: 0,
          outer: 75,
          inner: 35,
          start: (k * TAU) / 64,
          angle: TAU / 64,
          fill: ["#161616", "#606060", "#f6f6f6", "#b3b3b3"][k % 4],
        });
      if (reveal) draw(line([35, 0], [78, 0], ACCENT, 2));
      ctx.restore();
      if (reveal && from) {
        const a = rad(from.candidates[i].angle);
        draw(
          line(
            [120 + 35 * Math.cos(a), 120 + 35 * Math.sin(a)],
            [120 + 78 * Math.cos(a), 120 + 78 * Math.sin(a)],
            "#be6243",
            2,
          ),
        );
      }
    }
    if (id === "Q29") {
      if (!reveal) checkers(false).forEach(draw);
      ctx.save();
      ctx.beginPath();
      ctx.rect(72 + c.dx, 72, 96, 96);
      ctx.clip();
      ctx.translate(c.dx, 0);
      checkers(true).forEach(draw);
      ctx.restore();
      if (reveal) {
        draw(line([72, 60], [72, 185], ACCENT, 1));
        draw(rect(72 + c.dx, 72, 96, 96, null, INK, 1));
      }
    }
    if (id === "Q30") {
      draw(rect(14, 36, 212, 174, null, "#a4afae", 1));
      draw(line([120, 43], [120, 53], ACCENT, 2));
      if (!reveal) draw(rect(50 + c.frameDx, 67, 140, 106, null, ACCENT, 4));
      if (reveal) draw(line([120, 65], [120, 175], ACCENT, 1));
      draw(circle(120 + c.dx, 120, 6, INK, null));
    }
    if (id === "Q31") {
      const x = 73,
        y = 44,
        w = 94,
        h = 158;
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        reveal ? 25 : x,
        reveal ? 35 : y,
        reveal ? 190 : w,
        reveal ? 175 : h,
      );
      ctx.clip();
      draw(rect(10, 32, 220, 180, "#e4efeb"));
      const [vx, vy] = c.vector,
        travel = (c.phase / 1000) * 20 - 40;
      for (let k = -400; k < 500; k += 24)
        draw(
          line(
            [k + vx * travel, 35 + vy * travel],
            [k + 180 + vx * travel, 215 + vy * travel],
            ACCENT,
            10,
          ),
        );
      if (c.visible || reveal)
        draw(circle(c.markerX, c.markerY, 4, "#fff", INK, 1));
      ctx.restore();
      if (!reveal) draw(rect(x, y, w, h, null, INK, 3));
      if (reveal && from) {
        const a = from.candidates[i];
        draw(
          line([a.markerX, a.markerY], [c.markerX, c.markerY], "#b45a3e", 2),
        );
        draw(circle(a.markerX, a.markerY, 3, "#b45a3e", null));
      }
    }
    if (id === "Q32") {
      draw(circle(120, 120, 60, null, "#e1e7e3", 1));
      draw(circle(c.x, c.y, 6, INK, null));
      if (frame.flash)
        draw(
          line([c.markX, c.markY - 12], [c.markX, c.markY + 12], "#b44d2f", 2),
        );
    }
    if (id === "Q33") {
      if (!reveal)
        for (let x = 20; x < 225; x += 20)
          draw(rect(x, 40, 10, 160, "#2a2a2a"));
      const x = reveal ? c.x : c.wrappedX;
      draw(
        rect(
          x,
          103,
          22,
          34,
          ["#b0b0b0", "#e8e8e8", "#a4a4a4", "#ddd"][c.index],
          reveal ? INK : null,
          1,
        ),
      );
      if (reveal && from) {
        const a = from.candidates[i];
        draw(rect(a.x, 103, 22, 34, null, ACCENT, 1));
        draw(line([a.x, 155], [x, 155], ACCENT, 2));
      }
      if (!reveal && c.resetting) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(15, 40, 210, 160);
        ctx.font = "16px system-ui";
        ctx.fillStyle = INK;
        ctx.fillText("↻ 同じ向きに再提示", 25, 122);
      }
    }
  });
}
