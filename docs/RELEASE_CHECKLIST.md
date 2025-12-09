# Release Checklist

## Pre-Release

- [ ] All tests passing (`npm test -- --run`)
- [ ] E2E tests passing (`npx playwright test`)
- [ ] TypeScript clean (`npm run typecheck`)
- [ ] No ESLint errors
- [ ] Bundle size within budget (< 2.5MB gzip)
- [ ] Performance baseline met (> 24 FPS on mid-tier)
- [ ] Memory stable (< 400MB idle after 5 min)

## Documentation

- [ ] README reflects current features
- [ ] CHANGELOG updated
- [ ] Migration guide updated (if schema changed)
- [ ] Troubleshooting updated (if new error cases)

## Testing

- [ ] Manual test: fresh install flow
- [ ] Manual test: camera → LUT → record → playback
- [ ] Manual test: virtual camera in Zoom/Meet
- [ ] Manual test: settings persist across reload
- [ ] Test on Chrome, Firefox, Edge
- [ ] Test on low-end device (if available)

## Deployment

- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] Build succeeds in CI
- [ ] Deploy to staging (if available)
- [ ] Smoke test staging
- [ ] Deploy to production

## Post-Release

- [ ] Monitor for new errors
- [ ] Check analytics for crash rate
- [ ] Respond to user issues within 48h

## Rollback Plan

If critical issues found:

1. Revert to previous git tag
2. Redeploy previous version
3. Communicate to users if needed
4. Create hotfix branch for fix
