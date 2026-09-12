import assert from "node:assert";
import { nameError } from "../src/modules/identity/names";

// Clean names pass (unicode included)
assert.equal(nameError("Aki"), null);
assert.equal(nameError("Aperture Adept 7"), null);
assert.equal(nameError("Momo-chan_2nd"), null);
assert.equal(nameError("Søren O'Brien"), null);
assert.equal(nameError("命 Ember"), null);

// Blank / length
assert.ok(nameError("   ") !== null, "blank rejected");
assert.ok(nameError("x".repeat(81)) !== null, "overlong rejected");

// Unsafe characters (HTML, symbols, controls, emoji)
assert.ok(nameError("<script>alert(1)</script>") !== null, "html rejected");
assert.ok(nameError("Aki@home!") !== null, "symbols rejected");
assert.ok(nameError("Aki\nB") !== null, "control chars rejected");

// Blocklist: whole-word only, case-insensitive
assert.ok(nameError("You Fucker") !== null, "profanity rejected");
assert.ok(nameError("SHIT Hero") !== null, "case-insensitive");
assert.equal(nameError("Scunthorpe Sophie"), null, "no substring false-positive");
assert.equal(nameError("Classy Clive"), null, "no substring false-positive");

console.log("names.test.ts: all assertions passed");
