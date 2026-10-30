export const TAU = Math.PI * 2,
  rad = (d) => (d * Math.PI) / 180;
export const INK = "#25343c",
  ACCENT = "#176f66";
export const rgb = (a) => `rgb(${a.join(",")})`,
  gray = (v) => rgb([v, v, v]);
export const line = (a, b, stroke = INK, width = 3) => ({
  kind: "line",
  a,
  b,
  stroke,
  width,
});
export const rect = (x, y, w, h, fill, stroke = null, width = 1) => ({
  kind: "rect",
  x,
  y,
  w,
  h,
  fill,
  stroke,
  width,
});
export const circle = (x, y, r, fill = null, stroke = INK, width = 2) => ({
  kind: "circle",
  x,
  y,
  r,
  fill,
  stroke,
  width,
});
export const path = (
  points,
  stroke = INK,
  width = 3,
  fill = null,
  closed = false,
) => ({ kind: "path", points, stroke, width, fill, closed });
export const rotate = (p, d, center = [120, 120]) => {
  const a = rad(d),
    x = p[0] - center[0],
    y = p[1] - center[1];
  return [
    center[0] + x * Math.cos(a) - y * Math.sin(a),
    center[1] + x * Math.sin(a) + y * Math.cos(a),
  ];
};
export const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export function polygonArea(p) {
  return Math.abs(
    p.reduce(
      (s, a, i) =>
        s + a[0] * p[(i + 1) % p.length][1] - a[1] * p[(i + 1) % p.length][0],
      0,
    ) / 2,
  );
}
export function drawPrimitive(ctx, p) {
  ctx.save();
  ctx.lineWidth = p.width ?? 2;
  ctx.lineCap = "butt";
  ctx.lineJoin = "round";
  ctx.setLineDash(p.dash ?? []);
  let fill = p.fill;
  if (p.gradient) {
    const g = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
    for (const [s, c] of p.gradient) g.addColorStop(s, c);
    fill = g;
  }
  ctx.beginPath();
  switch (p.kind) {
    case "line":
      ctx.moveTo(...p.a);
      ctx.lineTo(...p.b);
      break;
    case "rect":
      ctx.rect(p.x, p.y, p.w, p.h);
      break;
    case "circle":
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      break;
    case "path":
      p.points.forEach((v, i) => (i ? ctx.lineTo(...v) : ctx.moveTo(...v)));
      if (p.closed) ctx.closePath();
      break;
    case "sector":
      ctx.arc(p.x, p.y, p.outer, p.start, p.start + p.angle);
      ctx.arc(p.x, p.y, p.inner, p.start + p.angle, p.start, true);
      ctx.closePath();
      break;
    default:
      throw new Error(`描画不能: ${p.kind}`);
  }
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (p.stroke) {
    ctx.strokeStyle = p.stroke;
    ctx.stroke();
  }
  ctx.restore();
}
export function drawLabel(ctx, text, x, y, size = 22) {
  ctx.save();
  ctx.font = `600 ${size}px system-ui,sans-serif`;
  ctx.fillStyle = INK;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
  ctx.restore();
}
export function layoutFor(wide = false) {
  return {
    columns: wide ? 4 : 2,
    width: wide ? 1000 : 500,
    height: wide ? 230 : 460,
    cellWidth: 250,
    cellHeight: 230,
  };
}
export function beginCanvas(canvas, wide) {
  const layout = layoutFor(wide),
    dpr = Math.min(devicePixelRatio || 1, 3),
    container = canvas.parentElement.getBoundingClientRect(),
    fit = Math.min(
      (container.width - 2) / layout.width,
      (container.height - 2) / layout.height,
    );
  canvas.style.width = `${fit * layout.width}px`;
  canvas.style.height = `${fit * layout.height}px`;
  const box = canvas.getBoundingClientRect();
  canvas.width = Math.round(box.width * dpr);
  canvas.height = Math.round(box.height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2Dを利用できません");
  const scale = Math.min(
    canvas.width / layout.width,
    canvas.height / layout.height,
  );
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, layout.width, layout.height);
  layout.labelSize = Math.max(22, 16 / fit);
  return { ctx, layout };
}
export function drawCandidates(ctx, candidates, layout, draw) {
  candidates.forEach((c, i) => {
    ctx.save();
    ctx.translate(
      (i % layout.columns) * 250 + 5,
      Math.floor(i / layout.columns) * 230,
    );
    ctx.beginPath();
    ctx.rect(0, 28, 240, 192);
    ctx.clip();
    draw(c, i);
    ctx.restore();
    drawLabel(
      ctx,
      "ABCD"[i],
      (i % layout.columns) * 250 + 16,
      Math.floor(i / layout.columns) * 230 + 3,
      layout.labelSize,
    );
  });
}
