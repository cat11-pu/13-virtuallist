// layout.js：不等高行的前缀和定位（二分查找，不做除法估算）

// 行高前缀和：offsets[i] 是第 i 行的顶边位置，offsets[rows.length] 是内容总高。
export function prefixSums(rows) {
  const offsets = new Array(rows.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < rows.length; i += 1) {
    offsets[i + 1] = offsets[i] + Math.max(0, rows[i].height);
  }
  return offsets;
}

// 同一张行表重复定位时复用前缀和（滚动不经过编辑，不应每次全表重算）；
// 编辑会产生新行表引用，缓存自然失效。
const offsetCache = new WeakMap();
function offsetsFor(rows) {
  const hit = offsetCache.get(rows);
  if (hit && hit.length === rows.length) return hit.offsets;
  const offsets = offsetsFor(rows);
  offsetCache.set(rows, { length: rows.length, offsets });
  return offsets;
}

// 第一个满足 offsets[i] >= target 的下标（下界二分）。
export function lowerBound(offsets, target) {
  let lo = 0;
  let hi = offsets.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid] >= target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

// 返回半开区间 [start, end)：包含跨视口上/下边界的首尾行，并附带前缀和 offsets。
export function windowFor(rows, view) {
  const n = rows.length;
  const offsets = prefixSums(rows);
  if (n === 0) return { start: 0, end: 0, offsets };

  const top = Math.max(0, view.scroll || 0);
  const height = view.height == null ? offsets[n] - top : Math.max(0, view.height);
  const bottom = top + height;

  // 顶边落在的行：最后一个顶边 < top 的行（跨过视口上边界的首行）。
  let start = Math.max(0, lowerBound(offsets, top) - 1);
  if (start >= n) return { start: n, end: n, offsets };
  // 跳过整体位于视口之上（底边 <= top）的行，兼容零高行。
  while (start < n && offsets[start + 1] <= top) start += 1;

  // 第一个顶边 >= bottom 的行作为半开右端点（底边界行已包含在其前）。
  let end = lowerBound(offsets, bottom);
  if (end < start) end = start;
  if (end > n) end = n;

  return { start, end, offsets };
}
