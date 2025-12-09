# Contributing to Lumia Pro

## Development Setup

```bash
git clone https://github.com/phlthy88/lumia-pro.git
cd lumia-pro
npm install
npm run dev
```

## Code Style

- TypeScript strict mode
- ESLint enforced
- Prettier for formatting

## Testing

### Unit Tests
```bash
npm run test           # Run once
npm run test:ui        # Interactive UI
npm run test:coverage  # With coverage report
```

### E2E Tests
```bash
npx playwright install  # First time only
npx playwright test     # Run all
npx playwright test --ui # Interactive mode
```

### Performance Testing
```bash
npm run build
npm run analyze  # Bundle size analysis
```

## Test Matrix

Before submitting PR, verify:

| Test | Command | Pass Criteria |
|------|---------|---------------|
| Types | `npm run typecheck` | No errors |
| Lint | `npx eslint src` | No errors |
| Unit | `npm test -- --run` | All pass |
| E2E | `npx playwright test` | All pass |
| Build | `npm run build` | Completes |
| Bundle | Check dist/ size | < 2.5MB gzip |

## Architecture Rules

1. Controllers don't import each other
2. Cross-module communication via EventBus
3. All services implement `dispose()`
4. Hooks clean up in useEffect return

## Pull Request Process

1. Create feature branch from `main`
2. Make changes with clear commits
3. Run full test matrix
4. Update docs if needed
5. Open PR with description of changes
6. Address review feedback

## Performance Benchmarks

When changing render pipeline or adding features:

1. Measure baseline FPS before changes
2. Measure after changes
3. Include in PR description:
   - FPS impact (if any)
   - Memory impact (if any)
   - Bundle size change
