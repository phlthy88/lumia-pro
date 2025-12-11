# Deployment Runbook

This runbook details the deployment process for the Lumia Pro application, covering both staging and production environments.

## Environments

- **Staging**: Deployed automatically from the `develop` branch. This environment is for testing and verification before a production release.
- **Production**: Deployed manually from the `main` branch. This environment is for the live application.

## Deployment Process

### Staging Deployment

1.  **Merge to `develop`**: When a feature is ready for testing, merge the feature branch into the `develop` branch.
2.  **Automatic Deployment**: The CI/CD pipeline will automatically trigger a deployment to the staging environment.
3.  **Verification**: Once the deployment is complete, the QA team and developers should verify the changes in the staging environment.

### Production Deployment

1.  **Merge to `main`**: Once the changes in the `develop` branch have been verified and are ready for release, merge the `develop` branch into the `main` branch.
2.  **Manual Trigger**: The production deployment is triggered manually from the GitHub Actions UI.
    1.  Go to the "Actions" tab in the GitHub repository.
    2.  Select the "CI/CD Pipeline" workflow.
    3.  Click the "Run workflow" dropdown on the right.
    4.  Ensure the "main" branch is selected.
    5.  Click the "Run workflow" button.
3.  **Verification**: After the deployment is complete, the team should verify the changes in the production environment.

## Rollback Procedures

In case of a critical issue in production, a rollback is necessary.

1.  **Revert the Merge**: Revert the pull request that introduced the issue.
2.  **Redeploy**: Trigger a new production deployment from the `main` branch. The CI/CD pipeline will deploy the previous version of the application.
3.  **Post-Mortem**: After the rollback is complete, conduct a post-mortem to understand the cause of the issue and prevent it from happening in the future.

## Required Secrets

The following secrets must be configured in the GitHub repository for deployments to work:

- `VERCEL_TOKEN`: Your Vercel access token.
- `VERCEL_ORG_ID`: Your Vercel organization ID.
- `VERCEL_PROJECT_ID`: Your Vercel project ID.
- `SENTRY_ORG`: Your Sentry organization slug.
- `SENTRY_PROJECT`: Your Sentry project slug.
- `SENTRY_AUTH_TOKEN`: Your Sentry auth token.
- `VITE_SENTRY_DSN`: Your Sentry DSN.
