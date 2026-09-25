// app.js：渲染结果（返回结构保持 visible/patched/reused/anchor_kept/span 五键）
import { patchPlan } from "./patch.js";

export function render(spec) {
  // 先应用编辑并修正滚动锚点，再在修正后的视口上二分定位可见窗口。
  const plan = patchPlan(spec.rows, spec.edits || [], spec.view);
  return {
    visible: plan.visible,
    patched: plan.patched,
    reused: plan.reused,
    anchor_kept: plan.anchor_kept,
    span: [plan.window.start, plan.window.end],
  };
}
