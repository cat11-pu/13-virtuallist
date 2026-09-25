import fs from "node:fs";
import { windowFor } from "./layout.js";
import { applyEdits, patchPlan } from "./patch.js";
import { render } from "./app.js";

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/view.json", "utf8"));
const state = applyEdits(spec.rows, spec.edits || [], spec.view);
const win = windowFor(state.rows, state.view);
const plan = patchPlan(spec.rows, spec.edits || [], spec.view);
const out = render(spec);

let badCode = "";
try {
  applyEdits(spec.rows, [{ op: "remove", at: -1 }], spec.view);
} catch (error) {
  badCode = error.code || error.message;
}

console.log("可见窗口行区间 =", JSON.stringify([win.start, win.end]));
console.log("可见行 =", JSON.stringify(out.visible));
console.log("需要重画的行 =", JSON.stringify(plan.patched));
console.log("可复用的行数 =", plan.reused);
console.log("锚定是否保持 =", plan.anchor_kept);
console.log("滚动偏移的修正量 =", state.shift);
console.log("非法编辑的错误码 =", badCode);
