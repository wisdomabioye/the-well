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
  staff: {
    roleId: "01994b10-0000-7000-8000-00000000000d",
    sessionId: "01994b10-0000-7000-8000-00000000000c",
    sessionToken: "e2e-staff-session-token",
    userId: "01994b10-0000-7000-8000-00000000000b",
  },
  passkeyUser: {
    sessionId: "01994b10-0000-7000-8000-000000000008",
    sessionToken: "e2e-passkey-session-token",
    userId: "01994b10-0000-7000-8000-000000000007",
  },
  visualUser: {
    sessionId: "01994b10-0000-7000-8000-00000000000a",
    sessionToken: "e2e-visual-session-token",
    userId: "01994b10-0000-7000-8000-000000000009",
  },
} as const;
