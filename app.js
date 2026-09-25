// app.js：渲染结果
import { windowFor } from "./layout.js";
import { applyEdits, patchPlan } from "./patch.js";

export function render(spec) {
  const state = applyEdits(spec.rows, spec.edits || [], spec.view);
  const plan = patchPlan(spec.rows, spec.edits || [], spec.view);
  const win = windowFor(state.rows, state.view);
  const visible = [];
  for (let index = win.start; index < win.end; index += 1) visible.push(state.rows[index].id);
  return { visible: visible, patched: plan.patched, reused: plan.reused,
           anchor_kept: plan.anchor_kept, span: [win.start, win.end] };
}
