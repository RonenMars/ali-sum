import assert from "node:assert/strict";
import test from "node:test";
import { isTerminal } from "./order-status";

test("treats expired AliExpress orders as terminal", () => {
  assert.equal(isTerminal("Expired"), true);
});
