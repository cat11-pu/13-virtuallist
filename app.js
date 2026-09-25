// app.js：渲染结果
import { windowFor } from "./layout.js";
import { patchPlan } from "./patch.js";

export function render(spec) {
  const rows = spec.rows;
  const win = windowFor(rows, spec.view);
  const plan = patchPlan(rows, spec.edits || [], spec.view);
  const visible = [];
  for (let index = win.start; index < win.end; index += 1) visible.push(rows[index].id);
  return { visible: visible, patched: plan.patched, reused: plan.reused,
           anchor_kept: plan.anchor_kept, span: [win.start, win.end] };
}
