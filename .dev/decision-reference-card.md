# LUMIA PRO: DECISION TREE & REFERENCE CARD
## Laminate This & Keep at Your Desk

---

## "SHOULD I SHIP THIS?" DECISION TREE

```
Start: "I have code I want to merge"
│
├─→ Does it have tests?
│   ├─ YES: Continue
│   └─ NO: ❌ STOP. Write tests first.
│
├─→ Do ALL tests pass?
│   ├─ YES: Continue
│   └─ NO: ❌ STOP. Fix failing tests.
│
├─→ Does it pass npm run typecheck?
│   ├─ YES: Continue
│   └─ NO: ❌ STOP. Fix TypeScript errors.
│
├─→ Does it pass npm run lint?
│   ├─ YES (0 errors): Continue
│   └─ NO (has errors): ❌ STOP. Fix lint errors.
│
├─→ Does it pass npm run size-check?
│   ├─ YES: Continue
│   └─ NO: ❌ STOP. Bundle is too big. Lazy load or remove.
│
├─→ Does commit message explain WHY?
│   ├─ YES: Continue
│   └─ NO: ❌ STOP. Rewrite commit message with explanation.
│
├─→ Is there a code review from 2 people?
│   ├─ YES: Continue
│   └─ NO: ❌ STOP. Get reviewed.
│
├─→ Did reviewers find issues?
│   ├─ NO: Continue
│   ├─ YES (fixed): Continue
│   └─ YES (unfixed): ❌ STOP. Address feedback.
│
└─→ ✅ SHIP IT!
    Merge to main with confidence.
```

---

## COMMIT MESSAGE TEMPLATE

```
TYPE: WHAT (Phase X impact)

WHY: [1-2 sentences explaining why this matters]

HOW: [Optional: explain implementation if non-obvious]

Testing: [How did you test this?]

Examples:

feat: Add OffscreenCanvas tests (Phase 0)

WHY: Safari doesn't support OffscreenCanvas.
Need tests to verify guard works and fallback succeeds.

HOW: Created 3 tests using Vitest mocks.
Test 1: Canvas created successfully
Test 2: Canvas unavailable (Safari)
Test 3: Fallback to HTMLCanvas

Testing: Ran npm test OffscreenCanvas.test.ts ✓

---

fix: Undo implementation with history stack (Phase 1)

WHY: Required for Phase 1 road stop.
Users need to undo edit changes.

HOW: Implemented EditorState + HistoryEntry pattern.
Schema tracks action type, before/after state.
Uses standard undo/redo with Ctrl+Z binding.

Testing: Tested all edit types: LUT, color, blur.
Added 8 unit tests covering happy path and edge cases.
```

---

## PR REVIEW CHECKLIST (Quick Version)

### First Reviewer (15 min)
- [ ] Fixes the stated problem?
- [ ] Logic correct? (walk through)
- [ ] Edge cases handled?
- [ ] Tests present + passing?
- [ ] Coverage up, not down?

### Second Reviewer (10 min)
- [ ] No bundle size increase >2%?
- [ ] No hardcoded secrets?
- [ ] No breaking API changes?
- [ ] No removal of error handling?
- [ ] Matches code style?

### Red Flags (Auto Reject)
```
❌ No tests
❌ Bundle size +5% or more
❌ Removes monitoring/logging
❌ Hardcoded API keys
❌ Breaks public APIs
```

---

## BUNDLE SIZE QUICK FIX FLOW

```
Problem: npm run size-check fails (bundle > 350KB)

Step 1: What grew?
npm run analyze
# Visualizes bundle, shows what's large

Step 2: Find root cause
- New dependency added?
- Code that should be lazy loaded?
- Duplicate code?

Step 3: Fix options
A) Lazy load the feature
   - Use React.lazy() for components
   - Use import() for services
   - Load on demand, not on init

B) Remove dependency
   - Do we really need it?
   - Is there a lighter alternative?

C) Split chunks further
   - Move feature to separate chunk
   - Update vite.config.ts manualChunks

Step 4: Verify
npm run build
npm run size-check
# Should show: ✅ PASSED
```

---

## TEST COVERAGE QUICK FIX FLOW

```
Problem: npm run test:coverage shows <60%

Step 1: See what's missing
npm run test:coverage
# Look for red lines (uncovered code)

Step 2: Prioritize
- Critical services: Aim for 100%
  (OffscreenCanvas, VirtualCamera, Recorder)
- UI components: Aim for 80%
  (ControlPanel, EditPanel)
- Utilities: Aim for 60%
  (helpers, validators)

Step 3: Write tests
For each uncovered line/block:
- What should happen?
- What inputs trigger it?
- What's the expected output?

Step 4: Verify
npm run test:coverage
# Target: >60% overall
# No regressions: All previous tests still pass
```

---

## DAILY STANDUP SCRIPT (Copy This)

**Your part** (2 min per person):
```
"Yesterday: [What you finished]
Today: [What you're starting]
Blocked: [Yes/No - if yes, explain]"

Example:
"Yesterday: Finished OffscreenCanvas tests (15 tests added)
Today: Starting VirtualCamera tests
Blocked: No, moving forward"
```

**Lead's part** (1 min):
```
"Any blockers we can help with?
Any decisions needed?
Plan for EOD?"
```

**Total time: 10 minutes. Hard stop at 10.**

---

## EMERGENCY DECISION MATRIX

| Situation | Decision | Action | Timeout |
|-----------|----------|--------|---------|
| **Production Error >5%** | Rollback? | Lead decides within 5 min | 5 min |
| **CI/CD Pipeline Broken** | Fix? | DevOps investigates | 30 min |
| **Test Failing Repeatedly** | Skip or Fix? | Full-Stack decides (skip only if blocking) | 1 hour |
| **Bundle Size > 400KB** | Ship or Delay? | Lead decides | 2 hours |
| **Blocked on Code** | Help or Proceed? | Ask Lead if blocked >15 min | 30 min |

---

## GIT COMMAND QUICK REFERENCE

```bash
# Daily workflow
git checkout -b feat/p0/feature-name
git add src/
git commit -m "feat: description (Phase 0)"
git push -u origin feat/p0/feature-name

# Updating before PR
git fetch origin
git rebase origin/main
git push --force-with-lease

# Fixing last commit (if not pushed)
git commit --amend --no-edit
git commit --amend -m "new message"

# Fixing wrong branch
git branch feat/p0/correct-name
git push -u origin feat/p0/correct-name
# Then open PR from new branch

# Undoing last commit (if not pushed)
git reset --soft HEAD~1  # Undo, keep changes
git reset --hard HEAD~1  # Undo, delete changes

# Merging after PR approved
# (Do in GitHub UI: Squash and merge)
```

---

## TEST WRITING TEMPLATE

```typescript
// src/services/__tests__/MyService.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MyService } from '../MyService';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    // Setup before each test
    service = new MyService();
  });

  afterEach(() => {
    // Cleanup after each test
    service.dispose?.();
  });

  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange: Setup
      const input = 'test';

      // Act: Do the thing
      const result = service.methodName(input);

      // Assert: Verify result
      expect(result).toBe('expected');
    });

    it('should handle error when [bad condition]', () => {
      // Arrange
      const badInput = null;

      // Act & Assert
      expect(() => service.methodName(badInput))
        .toThrow('Expected error message');
    });
  });
});
```

---

## SENTRY ERROR HANDLING PATTERN

```typescript
try {
  // Do something risky
  const result = await riskyFunction();
  
  // Log success if needed
  console.log('[Feature] Success', { result });
  
  return result;
} catch (error) {
  // Log error with context
  console.error('[Feature] Failed', { 
    error,
    context: 'what were we trying to do?'
  });
  
  // Always send to Sentry
  Sentry.captureException(error, {
    extra: {
      context: 'feature_name',
      userAction: 'what user did to trigger this'
    }
  });
  
  // Re-throw if caller should handle
  throw error;
  
  // OR return fallback if recoverable
  return fallbackValue;
}
```

---

## CODE STYLE QUICK RULES

**TypeScript**:
```typescript
// ✅ Good
const value: string = "hello";
const func = (input: number): number => input * 2;

// ❌ Bad
const value: any = "hello";
const func = (input) => input * 2;
```

**React Components**:
```typescript
// ✅ Good
export const MyComponent: FC<Props> = ({ prop1 }) => {
  return <div>{prop1}</div>;
};

// ❌ Bad
export default function MyComponent(props: any) {
  return <div>{props.prop1}</div>;
}
```

**Services**:
```typescript
// ✅ Good
export class MyService {
  static getInstance(): MyService { }
  async initialize(): Promise<void> { }
  dispose(): void { }
}

// ❌ Bad
export const myService = {
  init: () => { },
  doThing: (data: any) => { }
};
```

---

## PHASE 0 SUCCESS CRITERIA (MEMORIZE)

By End of Friday:

```
Bundle Size
├─ Target: <350KB
├─ Current: 281KB ✅ DONE
└─ Check: npm run size-check

Test Coverage
├─ Target: ≥60%
├─ Current: ?% ← MEASURE FRIDAY
└─ Check: npm run test:coverage

Code Quality
├─ TypeScript: 0 errors
│  └─ Check: npm run typecheck
├─ ESLint: 0 errors
│  └─ Check: npm run lint
├─ Tests: All passing
│  └─ Check: npm test
└─ No debug code left behind

Infrastructure
├─ CI/CD: All jobs passing ✅
├─ Sentry: Configured ✅
└─ Secrets: Not in git ✅

IF ALL GREEN: Phase 0 CLEARED 🎉
IF ANY RED: Fix before moving to Phase 1
```

---

## WHEN IN DOUBT, ASK

```
Question: "Should I [do X]?"
Answer:   "Run this to find out:"

Bundle size question?
→ npm run analyze

Test coverage question?
→ npm run test:coverage

Should I ship?
→ Does it pass the decision tree?

Am I doing it right?
→ Does it match the handbook?

Is code review done?
→ Check GitHub PR page

Is CI passing?
→ Check GitHub Actions
```

---

## THE SPIRIT OF THE GAME

We're not trying to:
- ❌ Be perfect
- ❌ Optimize prematurely
- ❌ Implement every edge case
- ❌ Make everyone happy

We're trying to:
- ✅ Ship working code
- ✅ Measure what matters
- ✅ Learn from users
- ✅ Iterate with confidence

If you're unsure between "ship it" and "polish it more":
→ **Ship it.** Real users will tell us if it's wrong.

---

**Printed**: December 11, 2025  
**Status**: Production Use - All Team Members  
**Last Updated**: v1.0  
**Next Review**: End of Phase 0 (Dec 15, 2025)
