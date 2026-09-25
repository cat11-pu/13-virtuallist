import fs from "node:fs";
import assert from "node:assert";
import { windowFor } from "./layout.js";
import { patchPlan } from "./patch.js";
import { render } from "./app.js";

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/view.json", "utf8"));

// 编辑后的行表与修正后的滚动位置
const plan = patchPlan(spec.rows, spec.edits || [], spec.view);
const win = windowFor(plan.rows, { scroll: plan.scroll, height: spec.view.height });
const out = render(spec);

// 非法下标编辑必须报 E_BAD_EDIT
let badCode = null;
const badCases = [
  { op: "remove", at: 99 },
  { op: "update", at: -1, height: 10 },
  { op: "insert", at: 99, row: { id: "rx", height: 10 } },
];
for (const badEdit of badCases) {
  try {
    patchPlan(spec.rows, [badEdit], spec.view);
  } catch (error) {
    badCode = error.code || String(error.message).split(":")[0];
    break;
  }
}

console.log("可见窗口行区间 =", JSON.stringify([win.start, win.end]));
console.log("可见行 =", JSON.stringify(out.visible));
console.log("需要重画的行 =", JSON.stringify(plan.patched));
console.log("可复用的行数 =", plan.reused);
console.log("锚定是否保持 =", plan.anchor_kept);
console.log("滚动偏移的修正量 =", plan.anchor_shift);
console.log("非法编辑的错误码 =", badCode);

// 验收断言
assert.deepStrictEqual([win.start, win.end], [0, 4]);
assert.deepStrictEqual(out.visible, ["r0", "r2", "r3", "r4"]);
assert.deepStrictEqual(plan.patched, ["r3", "r1"]);
assert.strictEqual(plan.reused, 3);
assert.strictEqual(plan.anchor_kept, true);
assert.strictEqual(plan.anchor_shift, 30);
assert.strictEqual(badCode, "E_BAD_EDIT");
console.log("验收通过");
