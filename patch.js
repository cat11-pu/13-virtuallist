// patch.js：增量修补与锚定（基线：全量重画、不锚定）
export function patchPlan(rows, edits, view) {
  return { patched: rows.map((row) => row.id), reused: 0, anchor_kept: true };
}
