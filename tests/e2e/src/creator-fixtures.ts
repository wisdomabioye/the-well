export const creatorE2EFixtures = {
  applicant: {
    sessionId: "01994b10-0000-7000-8000-000000000002",
    sessionToken: "e2e-applicant-session-token",
    userId: "01994b10-0000-7000-8000-000000000001",
  },
  reviewer: {
    roleId: "01994b10-0000-7000-8000-000000000005",
    sessionId: "01994b10-0000-7000-8000-000000000004",
    sessionToken: "e2e-reviewer-session-token",
    userId: "01994b10-0000-7000-8000-000000000003",
  },
  passkeyUser: {
    sessionId: "01994b10-0000-7000-8000-000000000008",
    sessionToken: "e2e-passkey-session-token",
    userId: "01994b10-0000-7000-8000-000000000007",
  },
} as const;
