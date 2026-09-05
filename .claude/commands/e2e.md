Run the full Cypress E2E suite against the staging Docker stack to check for regressions.

**IMPORTANT: Always run from the repo root using `docker compose` directly — never via `npm run e2e:docker` or any npm script.**

## Step 0 — Preflight: verify Docker has enough free space

**The relevant limit is Docker Desktop's VM disk, not the host's free
space.** `df -h /` on the host can show tens of GB free while the Docker
Desktop VM (a fixed-size virtual disk, e.g. 32 GB) is nearly full — that
mismatch is what causes silent "no space left on device" build failures
even on a host with plenty of room. Check the VM's real usage with:

```bash
docker run --rm alpine df -h /
```

Also check reclaimable space on the host side:

```bash
docker system df
```

If the VM disk is above ~80% full, prune before building. Build cache is
usually the biggest offender and regrows fast (10-20+ GB after a couple of
rebuilds), so prune it fully rather than relying on the default prune:

```bash
docker builder prune -a -f
docker system prune -f --volumes
```

This removes stopped containers, dangling images, unused networks, and all
build cache (including cache still referenced by an image layer history).
It does NOT remove named volumes unless `--volumes` is passed, and does not
touch running containers.

If Docker Desktop crashes or `docker` CLI returns "cannot connect" errors,
the daemon ran out of disk and died — restart Docker Desktop, then prune.

If the build fails with `input/output error` or `no space left on device`
(e.g. `ResourceExhausted: failed to copy files`) during layer extraction,
Docker ran out of VM disk mid-build. Prune (see above) and retry — checking
host `df -h /` alone will not reveal this, so don't skip the VM-disk check
above.

**Also check the frontend build context size** — this was the actual root
cause the first time this was diagnosed. The root `.dockerignore` had bare
`node_modules` and `.next` entries, but since the compose build `context:`
is the repo root (not `frontend/`), those bare patterns only excluded a
top-level `./node_modules` or `./.next` — they did **not** exclude
`frontend/node_modules` or `frontend/.next`. A stale local `frontend/.next`
(Turbopack cache, can reach several GB) was silently being sent as build
context on every build, re-consuming VM disk each time. Confirm with
`docker build --progress=plain` and look at the `transferring context`
line for the frontend stage — it should be tens of MB, not GB. The fix is
`**/.next` and `**/node_modules` entries (already applied in
`.dockerignore`) so the exclusion applies at any depth, not just the
context root.

## Step 1 — Run the full staging E2E suite (from repo root)

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml \
  up --build --abort-on-container-exit --exit-code-from cypress
```

This builds and starts: postgres, backend, frontend, proxy, cypress.

`backend-tests` is opt-in via a profile and does NOT start by default (it runs pytest and exits, which would trigger `--abort-on-container-exit` and kill Cypress).

To also run backend tests:

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml \
  --profile backend-tests up --build --abort-on-container-exit --exit-code-from cypress
```

## Step 2 — Triage failures

If specs fail, identify the failing spec(s) from the Cypress output. Likely categories:

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Element not found (`data-cy`) | Layout regression from CSS/component bump | Check tailwindcss or headlessui diff |
| API error in test | Backend change | Check DRF serializer or view diff |
| Build error mid-run (I/O error / `no space left on device`) | Docker Desktop VM disk full (host free space can look fine) | Run `docker builder prune -a -f && docker system prune -f --volumes` and retry |
| Flaky timeout | Container not fully ready | Re-run the spec once to confirm |

**Fix-and-verify workflow:** if a spec fails and you implement a fix, do not
immediately re-run the whole suite. Re-run only the failing spec first to
confirm the fix works:

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml \
  run --rm cypress npx cypress run --spec "frontend/cypress/e2e/<failing-spec>.cy.ts"
```

Only once that single spec passes should you re-run the full suite (Step 1)
to confirm there are no regressions elsewhere. This avoids paying the cost
of the full suite on every fix attempt.

## Step 3 — Clean up

After the run (pass or fail) tear down the staging stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml down -v
```
