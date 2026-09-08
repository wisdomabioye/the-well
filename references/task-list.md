# Implementation task list

Tasks are ordered by dependency and may advance only under `run-tasks-until-converged`.

| Order | Task                              | Status    | Blockers                                                       |
| ----- | --------------------------------- | --------- | -------------------------------------------------------------- |
| 1     | Wallet-stack qualification        | completed | None; temporary LaserEyes compatibility exception approved     |
| 2     | LaserEyes advisory resolution     | completed | Explicit beta risk acceptance recorded with mandatory controls |
| 3     | Wallet authentication             | pending   | Wallet-stack qualification; LaserEyes advisory resolution      |
| 4     | Authorization and account records | pending   | Wallet authentication                                          |
| 5     | Authenticated route family        | pending   | Wallet authentication; authorization and account records       |
| 6     | Creator admission                 | pending   | Authorization and account records; authenticated route family  |

The D15 authenticated-prevout dependency remains a separate parallel security gate outside this
ordered Week 2 list. It does not authorize enabling dependent allowlist behavior.
