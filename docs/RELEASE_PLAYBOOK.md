# Release & Rollback Playbook

This document serves as a checklist for the Release Engineer to ensure safe deployments and rapid recovery in case of issues.

## 🚀 Pre-Flight Checklist

Before initiating a deployment, ensure the following criteria are met:

- [ ] **Tests Passed:** Run `npm run test` and ensure all unit/integration tests pass.
- [ ] **Build Verification:** Run `npm run build` and ensure the bundle size is < 5MB (checked via `npm run size-check`).
- [ ] **Environment Variables:** Verify that `SENTRY_DSN` and other critical env vars are correctly set in the Vercel project settings.
- [ ] **Load Test (Optional):** For major releases, run `npm run test:load` against a staging environment.

## 📦 Deployment Steps

1.  **Tag the Release:**
    ```bash
    git tag v1.0.0
    git push origin v1.0.0
    ```

2.  **Deploy to Production (Vercel):**
    Ensure you are linked to the correct project (`lumia-pro-lens`).
    *Note: Replace `lumia-pro-lens` with the actual Project ID from `vercel project list` if different.*

    ```bash
    vercel deploy --prod
    ```

3.  **Post-Deployment Verification:**
    *   Visit the production URL.
    *   Check Sentry for any new spikes in errors.
    *   Verify critical paths (Model load, Camera start).

## ↩️ Rollback Procedure

If a critical bug is discovered after deployment, execute **one** of the following immediately.

### Option A: Git Revert (Preferred)
This creates a clean audit trail.

1.  **Revert the commit:**
    ```bash
    git revert HEAD
    ```
2.  **Push the revert:**
    ```bash
    git push origin main
    ```
    (This will trigger a new Vercel deployment automatically if CI/CD is connected).

### Option B: Vercel Rollback (Instant)
Use this if the Git process is too slow.

1.  **List previous deployments:**
    ```bash
    vercel deployments ls lumia-pro-lens --prod
    ```
2.  **Rollback to a stable deployment:**
    ```bash
    vercel rollback [deployment-id]
    ```
