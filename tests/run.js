import assert from "node:assert";
import { windowFor } from "../layout.js";
import { patchPlan } from "../patch.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok   " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const rows = [{ id: "r0", height: 20 }, { id: "r1", height: 30 }];

check("window has start and end", () => {
  const win = windowFor(rows, { scroll: 0, height: 100 });
  assert.strictEqual(typeof win.start, "number");
  assert.strictEqual(typeof win.end, "number");
});

check("window start not negative", () => {
  assert.ok(windowFor(rows, { scroll: -5, height: 100 }).start >= 0);
});

check("patchPlan returns arrays", () => {
  assert.ok(Array.isArray(patchPlan(rows, [], { scroll: 0, height: 100 }).patched));
});

check("patchPlan reports anchor flag", () => {
  assert.strictEqual(typeof patchPlan(rows, [], { scroll: 0, height: 100 }).anchor_kept, "boolean");
});

check("render exposes span", () => {
  assert.ok(Array.isArray(render({ rows: rows, edits: [], view: { scroll: 0, height: 100 } }).span));
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
