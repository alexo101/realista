import type { ClientPropertyStatus } from "./schema";

export const FINAL_CLIENT_PROPERTY_STATUSES: ClientPropertyStatus[] = [
  "interested",
  "rejected",
  "purchased_rented",
];

export function preservesFinalClientPropertyStatus(
  existing: ClientPropertyStatus | undefined,
  automaticStatus: ClientPropertyStatus,
): boolean {
  return existing !== undefined &&
    FINAL_CLIENT_PROPERTY_STATUSES.includes(existing) &&
    existing !== automaticStatus;
}
