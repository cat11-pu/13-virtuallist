// patch.js：增量修补与锚定（编辑应用、锚点修正、重画计划）
import { windowFor, ensureIndex, addHeight } from "./layout.js";

function badEdit() {
  const error = new Error("E_BAD_EDIT");
  error.code = "E_BAD_EDIT";
  return error;
}

function isIndex(at, length, allowEnd) {
  return Number.isInteger(at) && at >= 0 && (allowEnd ? at <= length : at < length);
}

function planEdit(rows, edits, view) {
  const scroll = Math.max(0, (view && view.scroll) || 0);
  const height = Math.max(0, (view && view.height) || 0);
  const before = windowFor(rows, { scroll: scroll, height: height });
  let anchor = before.start < before.end ? before.start : -1;
  const work = rows.map((row) => ({ id: row.id, height: row.height }));
  const patched = [];
  let shift = 0;
  for (const edit of edits) {
    if (!edit || typeof edit !== "object") throw badEdit();
    if (edit.op === "update") {
      if (!isIndex(edit.at, work.length, false)) throw badEdit();
      if (typeof edit.height !== "number" || !(edit.height > 0)) throw badEdit();
      const delta = edit.height - work[edit.at].height;
      work[edit.at] = { id: work[edit.at].id, height: edit.height };
      if (delta !== 0) addHeight(work, edit.at, delta);
      patched.push(work[edit.at].id);
    } else if (edit.op === "remove") {
      if (!isIndex(edit.at, work.length, false)) throw badEdit();
      const removed = work[edit.at];
      if (anchor >= 0 && edit.at <= anchor) {
        shift += removed.height;
        if (edit.at < anchor) anchor -= 1;
      }
      patched.push(removed.id);
      work.splice(edit.at, 1);
      ensureIndex(work);
      if (anchor >= work.length) anchor = work.length - 1;
    } else if (edit.op === "insert") {
      if (!isIndex(edit.at, work.length, true)) throw badEdit();
      const row = edit.row && typeof edit.row === "object" ? edit.row : edit;
      if (typeof row.id !== "string" || typeof row.height !== "number" || !(row.height > 0)) throw badEdit();
      if (anchor >= 0 && edit.at <= anchor) { shift -= row.height; anchor += 1; }
      work.splice(edit.at, 0, { id: row.id, height: row.height });
      ensureIndex(work);
      patched.push(row.id);
    } else {
      throw badEdit();
    }
  }
  const kept = scroll - shift >= 0;
  const nextView = { scroll: Math.max(0, scroll - shift), height: height };
  const win = windowFor(work, nextView);
  const original = new Map(rows.map((row) => [row.id, row.height]));
  const patchedSet = new Set(patched);
  for (let i = win.start; i < win.end; i += 1) {
    if (original.has(work[i].id) && original.get(work[i].id) !== work[i].height) {
      for (let j = i; j < win.end; j += 1) {
        if (!patchedSet.has(work[j].id)) { patchedSet.add(work[j].id); patched.push(work[j].id); }
      }
      break;
    }
  }
  let reused = 0;
  for (let i = win.start; i < win.end; i += 1) {
    if (!patchedSet.has(work[i].id)) reused += 1;
  }
  return { rows: work, view: nextView, shift: shift, patched: patched,
           reused: reused, anchor_kept: kept };
}

export function applyEdits(rows, edits, view) {
  const plan = planEdit(rows, edits || [], view || {});
  return { rows: plan.rows, view: plan.view, shift: plan.shift };
}

export function patchPlan(rows, edits, view) {
  const plan = planEdit(rows, edits || [], view || {});
  return { patched: plan.patched, reused: plan.reused, anchor_kept: plan.anchor_kept };
}
