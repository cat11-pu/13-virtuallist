// layout.js：行高与定位（基线：定高假设、线性扫描）
export function windowFor(rows, view) {
  const scroll = Math.max(0, view.scroll);
  const start = Math.floor(scroll / 24);
  return { start: start, end: Math.min(rows.length, start + 30), offsets: [] };
}
