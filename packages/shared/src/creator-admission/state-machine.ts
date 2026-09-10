import type {
  CreatorAdmissionAction,
  CreatorApplicationState,
} from "./contracts.ts";

const transitions: Readonly<
  Record<
    CreatorApplicationState,
    Readonly<Partial<Record<CreatorAdmissionAction, CreatorApplicationState>>>
  >
> = {
  approved: { revoke: "revoked", suspend: "suspended" },
  "changes-requested": {
    "save-draft": "changes-requested",
    resubmit: "submitted",
  },
  draft: { "save-draft": "draft", submit: "submitted" },
  rejected: {},
  revoked: {},
  submitted: { "start-review": "under-review" },
  suspended: { reinstate: "approved", revoke: "revoked" },
  "under-review": {
    approve: "approved",
    reject: "rejected",
    "request-changes": "changes-requested",
  },
};

export function resolveCreatorAdmissionTransition(
  state: CreatorApplicationState,
  action: CreatorAdmissionAction,
): CreatorApplicationState | null {
  return transitions[state][action] ?? null;
}
