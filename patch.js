// patch.js：增量修补与锚定
import { lowerBound, prefixSums, windowFor } from "./layout.js";

// 非法编辑统一抛 E_BAD_EDIT。
function badEdit(message) {
  const error = new Error("E_BAD_EDIT" + (message ? ": " + message : ""));
  error.code = "E_BAD_EDIT";
  return error;
}

// 把编辑序列依次应用到行表（update / remove / insert），返回新行表与涉及行 id。
function applyEdits(rows, edits) {
  const next = rows.map((row) => ({ id: row.id, height: row.height }));
  const touched = [];
  for (const edit of edits || []) {
    const at = edit && edit.at;
    if (!Number.isInteger(at) || at < 0 || at > next.length) {
      throw badEdit("index out of range");
    }
    if (edit.op === "update") {
      if (at === next.length) throw badEdit("update at end");
      const height = edit.height;
      if (typeof height !== "number" || !Number.isFinite(height) || height < 0) {
        throw badEdit("bad height");
      }
      touched.push(next[at].id);
      next[at] = { id: next[at].id, height };
    } else if (edit.op === "remove") {
      if (at === next.length) throw badEdit("remove at end");
      touched.push(next[at].id);
      next.splice(at, 1);
    } else if (edit.op === "insert") {
      const row = edit.row;
      if (!row || row.id == null) throw badEdit("insert needs row id");
      const height = row.height;
      if (typeof height !== "number" || !Number.isFinite(height) || height < 0) {
        throw badEdit("bad height");
      }
      const placed = { id: row.id, height };
      touched.push(placed.id);
      next.splice(at, 0, placed);
    } else {
      throw badEdit("unknown op");
    }
  }
  return { rows: next, touched };
}

export function patchPlan(rows, edits, view) {
  const list = Array.isArray(rows) ? rows : [];
  const { rows: next, touched } = applyEdits(list, edits);

  const oldOffsets = prefixSums(list);
  const newOffsets = prefixSums(next);
  const scroll = Math.max(0, view && view.scroll || 0);

  // 锚点：视口顶边之下第一个顶边 >= scroll 的行（第一个完整可见行）。
  let anchor = null;
  if (list.length > 0 && scroll < oldOffsets[list.length]) {
    const index = Math.min(lowerBound(oldOffsets, scroll), list.length - 1);
    anchor = { id: list[index].id, top: oldOffsets[index] };
  }

  let anchorKept = anchor === null;
  let anchorShift = 0;
  let correctedScroll = scroll;
  if (anchor) {
    const newIndex = next.findIndex((row) => row.id === anchor.id);
    if (newIndex === -1) {
      anchorKept = false;
    } else {
      anchorKept = true;
      // 锚点前内容收缩时为正（scroll 需回拨），膨胀时为负。
      anchorShift = anchor.top - newOffsets[newIndex];
      correctedScroll = Math.max(0, scroll - anchorShift);
    }
  }

  // 修正后的视口上做二分定位（对数级）。
  const correctedView = { scroll: correctedScroll, height: view ? view.height : 0 };
  const win = windowFor(next, correctedView);
  const visible = next.slice(win.start, win.end);
  const visibleIds = visible.map((row) => row.id);
  const heightChanged = new Map();
  for (const row of visible) {
    const before = list.find((old) => old.id === row.id);
    if (before && before.height !== row.height) heightChanged.set(row.id, true);
  }

  // patched 先按编辑次序给出本次编辑涉及的行，再追加可见范围内行高变化行
  // 及其后继可见行（后继行需要按新前缀和重新摆放，不能沿用旧绘制结果）。
  const patched = [];
  const mark = (id) => {
    if (!patched.includes(id)) patched.push(id);
  };
  touched.forEach(mark);
  if (heightChanged.size > 0) {
    for (let i = 0; i < visible.length; i += 1) {
      if (heightChanged.has(visible[i].id)) {
        for (let j = i; j < visible.length; j += 1) mark(visible[j].id);
        break;
      }
    }
  }

  const repaint = patched.filter((id) => visibleIds.includes(id));
  const reused = visible.length - repaint.length;

  return {
    patched,
    reused,
    anchor_kept: anchorKept,
    anchor_shift: anchorShift,
    scroll: correctedScroll,
    rows: next,
    window: win,
    visible: visibleIds,
  };
}
