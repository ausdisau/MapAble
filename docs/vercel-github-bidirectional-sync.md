# Vercel ↔ GitHub bidirectional synchronization

## Status

**Implemented in repository workflow, not yet fully activated in Vercel.**

The canonical repository is `ausdisau/MapAble`.

The intended synchronization model is:

1. **GitHub → Vercel**
   - Vercel's native GitHub integration watches `ausdisau/MapAble`.
   - `main` is the production branch.
   - `apps/web` is the Vercel project root.
   - pull requests create preview deployments.
   - pushes to `main` create production deployments subject to Vercel project policy.

2. **Vercel → GitHub**
   - Vercel emits `repository_dispatch` deployment events.
   - `.github/workflows/vercel-bidirectional-sync.yml` receives those events.
   - the workflow resolves the originating commit SHA.
   - it mirrors deployment state to that commit under the status context `Vercel / deployment`.
   - deployment URLs are attached as the status target when provided.

This is synchronization of **source-triggered deployments and deployment evidence**, not a two-way source-code editor. Vercel does not become a second canonical Git repository.

## Current mismatch to resolve

The Vercel project visible during setup was linked to:

- GitHub repository: `ausdisau/mapableau-new`

The canonical repository is now:

- GitHub repository: `ausdisau/MapAble`

Until the Vercel project is relinked (or a new Vercel project is created) against `ausdisau/MapAble`, GitHub → Vercel automatic deployment cannot be considered verified for the canonical repository.

## Required Vercel configuration

Configure the production web project with:

- repository: `ausdisau/MapAble`
- production branch: `main`
- root directory: `apps/web`
- framework: Next.js (auto-detected where possible)

Do not copy production secrets into GitHub workflows. Keep Vercel environment secrets in Vercel and repository/action secrets in GitHub according to least privilege.

## Deployment feedback events

The workflow accepts the current Vercel GitHub integration event family:

- `vercel.deployment.ready`
- `vercel.deployment.success`
- `vercel.deployment.error`
- `vercel.deployment.canceled`
- `vercel.deployment.ignored`
- `vercel.deployment.skipped`
- `vercel.deployment.pending`
- `vercel.deployment.failed`
- `vercel.deployment.promoted`

The workflow maps these to GitHub commit statuses:

| Vercel event | GitHub status |
|---|---|
| ready / success / promoted | success |
| error / failed | failure |
| pending | pending |
| canceled / ignored / skipped | error |

If a Vercel payload does not contain an identifiable source commit SHA, the workflow records a summary but does not write a status to an arbitrary commit.

## Loop prevention

The reverse synchronization workflow does **not** commit files, move branches, open pull requests, or trigger source changes. It only writes deployment status metadata to the originating commit. This prevents deployment feedback from creating an infinite Git ↔ deployment loop.

## Security boundary

The workflow uses GitHub's ephemeral `GITHUB_TOKEN` with only:

- `contents: read`
- `statuses: write`

No Vercel token, GitHub PAT, production credential, database credential, participant data, or disability information is stored in the workflow.

## Verification checklist

After Vercel is linked to `ausdisau/MapAble`:

1. open a harmless PR changing `apps/web`;
2. confirm Vercel creates a preview deployment;
3. confirm Vercel emits a repository-dispatch deployment event;
4. confirm the source commit receives `Vercel / deployment` status;
5. confirm the status links to the preview deployment;
6. merge only after normal CI and accessibility/security checks pass;
7. confirm the `main` commit gets the production deployment status;
8. confirm no workflow creates source commits in response to deployment events.

## Evidence states

- GitHub reverse-status workflow: **implemented, not independently verified with a live Vercel event**.
- Canonical repository structure (`apps/web`): **verified in GitHub**.
- Vercel link to `ausdisau/MapAble`: **not yet verified**.
- Existing inspected Vercel link to `ausdisau/mapableau-new`: **verified at inspection time**.

Production deployment remains a separate owner-controlled action and should not be inferred merely from repository configuration.
