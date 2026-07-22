# PR #390 — Vercel Preview build memory

**Status:** `OWNER_ACTION_REQUIRED` if Preview remains ERROR after tip with 6144 MB heap  
**Do not** weaken `ignoreDuringBuilds` / `ignoreBuildErrors`.

## Evidence

| Deployment                         | SHA        | Heap | Failure                          |
| ---------------------------------- | ---------- | ---- | -------------------------------- |
| `dpl_GPMHcZxiyLb1T42F3W7Zt5WxRrUb` | `47bc425b` | 6144 | `out_of_memory` / worker SIGKILL |
| `dpl_5ydRxpvGxhfL8SdnKvoXr2HpCwAs` | `54536e12` | 5632 | JS heap OOM during lint+types    |
| Prior READY on same project        | `8e722ec5` | 6144 | READY (earlier tip)              |

## Repository posture

- GitHub CI / Accessibility / type-check remain the authoritative compile gates.
- Vercel Preview memory is constrained on the default 8 GB builder.
- Owner may upgrade the Vercel build machine size or approve a documented
  profiling follow-up; agents must not change Production env or disable build
  type/lint gates.

## Owner action

1. In Vercel project settings, use a larger build machine if available for this team.
2. Redeploy the PR Preview from the reviewed tip.
3. Record deployment ID + READY evidence (no secrets).
