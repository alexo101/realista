import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  preservesFinalClientPropertyStatus,
} from "./client-property-status";

describe("client property status transitions", () => {
  it("preserves manual final statuses during automatic transitions", () => {
    assert.equal(
      preservesFinalClientPropertyStatus("interested", "sent"),
      true,
    );
    assert.equal(
      preservesFinalClientPropertyStatus("rejected", "visit_scheduled"),
      true,
    );
    assert.equal(
      preservesFinalClientPropertyStatus("purchased_rented", "recommended"),
      true,
    );
  });

  it("allows automatic transitions for non-final statuses", () => {
    assert.equal(
      preservesFinalClientPropertyStatus("recommended", "sent"),
      false,
    );
    assert.equal(
      preservesFinalClientPropertyStatus("sent", "visit_scheduled"),
      false,
    );
    assert.equal(
      preservesFinalClientPropertyStatus(undefined, "recommended"),
      false,
    );
  });
});
