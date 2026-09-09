# Implementation task list

Tasks are ordered by dependency and may advance only under `run-tasks-until-converged`.

| Order | Task                              | Status    | Blockers                                                       |
| ----- | --------------------------------- | --------- | -------------------------------------------------------------- |
| 1     | Wallet-stack qualification        | completed | None; temporary LaserEyes compatibility exception approved     |
| 2     | LaserEyes advisory resolution     | completed | Explicit beta risk acceptance recorded with mandatory controls |
| 3     | Detachable feature composition    | completed | None; composition and detachment contracts are verified        |
| 4     | Wallet authentication             | completed | None; auth-owned hashed-session boundary approved              |
| 5     | Authorization and account records | completed | None; converged account and authorization boundary             |
| 6     | Authenticated route family        | pending   | Wallet authentication; authorization and account records       |
| 7     | Creator admission                 | pending   | Authorization and account records; authenticated route family  |
| 8     | Public product route families     | pending   | Authenticated route family                                     |

The D15 authenticated-prevout dependency remains a separate parallel security gate outside this
ordered Week 2 list. It does not authorize enabling dependent allowlist behavior.
