// layout.js：行高与定位（前缀和 + 二分定位，Fenwick 树增量维护）
const indexes = new WeakMap();

function buildIndex(rows) {
  const n = rows.length;
  const bit = new Float64Array(n + 1);
  for (let i = 0; i < n; i += 1) bit[i + 1] = rows[i].height;
  for (let i = 1; i <= n; i += 1) {
    const j = i + (i & -i);
    if (j <= n) bit[j] += bit[i];
  }
  return { bit: bit, size: n, offsets: null };
}

export function ensureIndex(rows) {
  let index = indexes.get(rows);
  if (!index || index.size !== rows.length) {
    index = buildIndex(rows);
    indexes.set(rows, index);
  }
  return index;
}

export function addHeight(rows, at, delta) {
  const index = ensureIndex(rows);
  for (let i = at + 1; i < index.bit.length; i += i & -i) index.bit[i] += delta;
  index.offsets = null;
}

function prefixSum(bit, k) {
  let sum = 0;
  for (; k > 0; k -= k & -k) sum += bit[k];
  return sum;
}

function highestOneBit(n) {
  let bit = 1;
  while (bit * 2 <= n) bit *= 2;
  return bit;
}

function upperLE(bit, n, x) {
  let k = 0;
  let acc = 0;
  for (let step = highestOneBit(n); step > 0; step >>= 1) {
    const next = k + step;
    if (next <= n && acc + bit[next] <= x) { acc += bit[next]; k = next; }
  }
  return k;
}

function lowerGE(bit, n, x) {
  let k = 0;
  let acc = 0;
  for (let step = highestOneBit(n); step > 0; step >>= 1) {
    const next = k + step;
    if (next <= n && acc + bit[next] < x) { acc += bit[next]; k = next; }
  }
  return k + 1;
}

export function windowFor(rows, view) {
  const index = ensureIndex(rows);
  const n = rows.length;
  const total = prefixSum(index.bit, n);
  const height = Math.max(0, (view && view.height) || 0);
  const top = Math.min(Math.max(0, (view && view.scroll) || 0), Math.max(0, total - height));
  const bottom = Math.min(top + height, total);
  const start = n === 0 ? 0 : Math.min(upperLE(index.bit, n, top), n);
  let end = bottom <= 0 ? start : Math.min(lowerGE(index.bit, n, bottom), n);
  if (end < start) end = start;
  if (!index.offsets) {
    const offsets = new Array(n);
    let acc = 0;
    for (let i = 0; i < n; i += 1) { acc += rows[i].height; offsets[i] = acc; }
    index.offsets = offsets;
  }
  return { start: start, end: end, offsets: index.offsets };
}
