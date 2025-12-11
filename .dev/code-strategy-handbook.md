# LUMIA PRO: CODE STRATEGY HANDBOOK
## Team Execution Guidelines for Phase 0-3 (Weeks 1-12)

**Version**: 1.0  
**Date**: December 11, 2025  
**Target Audience**: 3-4 engineers (Lead, Full-Stack, DevOps)  
**Status**: Production-Grade, Enforceable Standards

---

# TABLE OF CONTENTS

1. [Core Philosophy](#core-philosophy)
2. [Communication Standards](#communication-standards)
3. [Git Workflow & Branching](#git-workflow--branching)
4. [Code Quality Standards](#code-quality-standards)
5. [Testing Requirements](#testing-requirements)
6. [PR & Review Process](#pr--review-process)
7. [Performance & Bundle Rules](#performance--bundle-rules)
8. [Monitoring & Observability](#monitoring--observability)
9. [Deployment Procedures](#deployment-procedures)
10. [Emergency Protocols](#emergency-protocols)
11. [Phase Checkpoints](#phase-checkpoints)

---

# CORE PHILOSOPHY

## The Five Directives (Non-Negotiable)

### D1: Shipping is the Feature
- **What it means**: Real user feedback beats theoretical perfection
- **Action**: Fix critical path (Phase 0-1), then monitor and iterate
- **Decision Rule**: When in doubt, ship and measure

### D2: Guardrails Over Heroics
- **What it means**: Fatigue causes bugs; automation beats willpower
- **Action**: Automate checks, enforce road stops, rotate on-call
- **Decision Rule**: If it can be automated, automate it. If it can be scheduled, schedule it.

### D3: Observability First
- **What it means**: You can't fix what you can't see
- **Action**: Structured logging, dashboards, alerts from day 1
- **Decision Rule**: Every new feature must include observability

### D4: Every Change is Tested
- **What it means**: Prevents invisible breakage
- **Action**: Pre-push hooks, CI gates, manual staging validation
- **Decision Rule**: No code ships without a test. Exception: config-only changes (logged)

### D5: Rollback is Practiced
- **What it means**: When (not if) you need to rollback, you need to be fast
- **Action**: Test rollback monthly, canary deploys, blue-green ready
- **Decision Rule**: If you haven't tested the rollback, you can't deploy

---

# COMMUNICATION STANDARDS

## Synchronous Communication

### Daily Standup (9 AM, 10 min, #lumia-launch)

**Required Attendees**: Lead, Full-Stack, DevOps  
**Format**:

```
Lead:    "What's blocking launch?"
Dev 1:   "[Feature name]: [% done], [blocker if any]"
Dev 2:   "[Feature name]: [% done], [blocker if any]"
DevOps:  "[Infra task]: [status], [blocker if any]"

Risks:   Any showstoppers? Any help needed?
Plan:    What gets done by 5 PM today?
```

**Example**:
```
Lead:     "What's blocking Week 3?"
Full-Stack: "Test coverage: 45% done (need 15 more hours), blocker: none"
Full-Stack: "Undo feature: 20% done (auth system complex), blocker: schema review"
DevOps:    "Sentry setup: complete, staging ready, no blockers"

Risks:     Undo schema is complex, might take 14h not 12h
Plan:      Full-Stack focuses on undo, test coverage secondary
```

**Frequency**: Every weekday, 9 AM sharp. Skip weekends. Async update Friday EOD if async week.

### Weekly Sync (Friday, 4 PM, 30 min)

**Required Attendees**: All  
**Agenda**:
1. Phase progress (who presents: Lead)
2. Blockers & how to unblock (20 min discussion)
3. Staffing/capacity issues
4. Next week focus

**Output**: Status message posted to #lumia-launch by 4:30 PM Friday

### Async Communication

**Slack Channels** (only these 4):

| Channel | Purpose | Posting Rules |
|---------|---------|---------------|
| `#lumia-launch` | Daily status, blockers, decisions | Thread replies only, max 1 main per day per person |
| `#lumia-incidents` | Production alerts, rollback decisions | Real-time only, tagged with severity |
| `#lumia-code-review` | PR reviews, code questions | Link PR, tag reviewer, no flame wars |
| `#lumia-monitoring` | Automated alerts from Sentry/Vercel | Automated only, no manual posts |

**Golden Rule**: Use threads. No cross-talk in main channel. One decision per day per channel.

---

# GIT WORKFLOW & BRANCHING

## Branch Naming Convention

```
[type]/[phase]/[description]

Types:
- feat    = New feature
- fix     = Bug fix
- refactor = Code cleanup
- test    = Tests only
- chore   = Config, deps, docs
- perf    = Performance optimization

Phases:
- p0     = Phase 0 (Days 1-4)
- p1     = Phase 1 (Weeks 1-2)
- p2     = Phase 2 (Weeks 5-8)
- p3     = Phase 3 (Weeks 9-12)

Examples:
- feat/p0/lazy-load-ai-features
- fix/p1/undo-implementation
- test/p0/offscreencanvas-coverage
- perf/p1/bundle-optimization
```

## Commit Message Format

```
[TYPE]: [WHAT] (Phase X impact)

[WHY] (optional but recommended)

[HOW] (only if non-obvious)

Examples:

feat: Add OffscreenCanvas tests (Phase 0 blocker)

Safari crashes without proper guarding. Added 3 tests:
1. Canvas creation success path
2. Canvas unavailable guard path
3. Fallback to 2D context

---

fix: Undo implementation with history stack (Phase 1)

Complex feature with multiple edit types. Schema:
- EditorState: current filters, adjustments
- HistoryEntry: action type, before state, after state
- UndoStack: array of entries, pointer to current

Tested with all edit types: LUT, color, blur, etc.
```

## Commit Checklist (Before `git push`)

```
Before you push, VERIFY:

Code:
[ ] Compiles: npm run typecheck (no errors)
[ ] Lints: npx eslint src (warnings acceptable)
[ ] Tests pass: npm test (no failures)
[ ] Bundle check: npm run size-check (no red)

Documentation:
[ ] Commit message explains WHY, not just what
[ ] Linked to Phase (p0/p1/p2/p3)
[ ] If new service/hook: JSDoc added

Observability:
[ ] New feature has logging/metrics? (yes or N/A)
[ ] New feature has error handling? (yes or N/A)
[ ] New API call has try/catch? (yes or N/A)

Safety:
[ ] No console.log() left behind
[ ] No hardcoded API keys/secrets
[ ] No breaking changes to public APIs
```

## PR Workflow

### Creating a PR

```bash
# 1. Create feature branch
git checkout -b feat/p0/lazy-load-ai-features

# 2. Make changes, test locally
npm test
npm run build
npm run size-check

# 3. Push and open PR
git push -u origin feat/p0/lazy-load-ai-features

# 4. PR title format
Title: "feat: Lazy load AI features for bundle optimization"

Body:
## What
Moves AI features (MediaPipe, VisionWorker) to separate lazy-loaded chunk.

## Why
Main bundle was 498KB, target 350KB. Lazy loading saves 217KB.

## How
- Created AIPanel.tsx with React.lazy()
- Updated vite.config.ts with manual chunks
- AI features load only when AI tab clicked

## Testing
- Tested locally: AI tab loads with spinner
- Bundle check: 281KB main (✓ under 350KB limit)
- App functionality: preserved

Fixes #[issue number if applicable]
```

---

# CODE QUALITY STANDARDS

## TypeScript Rules (Strict Mode)

```typescript
// ✅ GOOD: Explicit types everywhere
const formatBytes = (bytes: number): string => {
  return (bytes / 1024).toFixed(2) + ' KB';
};

interface BundleMetrics {
  mainBundle: number;
  vendorChunks: Record<string, number>;
  timestamp: Date;
}

// ❌ BAD: Any types, implicit returns
const formatBytes = (bytes) => {
  return (bytes / 1024).toFixed(2) + ' KB';
};

const metrics: any = { /* ... */ };
```

**Rule**: If `any` appears in code, add comment explaining why (these become Phase 2 debt)

```typescript
// ❌ NEVER
const data: any = response.data;

// ✅ OK (for now, mark as Phase 2 debt)
const data: unknown = response.data;
// Phase 2: Proper typing for API response
```

## ESLint Rules (Enforced)

**Errors** (CI will fail):
- `no-console` — No debug logs in production
- `@typescript-eslint/no-unused-vars` — Delete dead code
- `no-debugger` — Remove breakpoints before commit

**Warnings** (allowed but discouraged):
- `@typescript-eslint/no-explicit-any` — Phase 2 cleanup
- `react/prop-types` — TypeScript is your prop validation
- `prefer-const` — Nice to have

**Ignored** (not enforced):
- Camelcase in external APIs
- Unused parameters in mocked functions

## Component Structure (React)

```typescript
// ✅ STANDARD STRUCTURE

import React, { useState, useCallback } from 'react';
import type { FC } from 'react';

interface MyComponentProps {
  title: string;
  onAction?: (value: string) => void;
  disabled?: boolean;
}

/**
 * MyComponent - Brief description
 * @param props - Component properties
 * @returns Rendered component
 */
export const MyComponent: FC<MyComponentProps> = ({
  title,
  onAction,
  disabled = false
}) => {
  const [state, setState] = useState<string>('');

  const handleClick = useCallback(() => {
    if (disabled) return;
    onAction?.(state);
  }, [state, onAction, disabled]);

  return (
    <div role="button" onClick={handleClick}>
      {title}
    </div>
  );
};

// Export with display name for debugging
MyComponent.displayName = 'MyComponent';
```

**Rules**:
1. Always export named components, never default
2. Always use `interface` for props, never inline types
3. Always add JSDoc comment
4. Always include `displayName`
5. Use callbacks with `useCallback` for event handlers

## Service/Hook Structure

```typescript
// ✅ Service pattern

/**
 * OffscreenCanvasService - Manages WebGL rendering context
 * Handles Safari incompatibility gracefully
 */
export class OffscreenCanvasService {
  private static instance: OffscreenCanvasService;
  private canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private context: WebGL2RenderingContext | null = null;

  static getInstance(): OffscreenCanvasService {
    if (!OffscreenCanvasService.instance) {
      OffscreenCanvasService.instance = new OffscreenCanvasService();
    }
    return OffscreenCanvasService.instance;
  }

  /**
   * Initialize canvas with fallback for Safari
   * @throws Error if both OffscreenCanvas and HTMLCanvas fail
   */
  async initialize(): Promise<WebGL2RenderingContext> {
    try {
      this.canvas = new OffscreenCanvas(1920, 1080);
      this.context = this.canvas.getContext('webgl2');
      if (!this.context) throw new Error('WebGL2 not supported');
      return this.context;
    } catch (e) {
      // Fallback to HTMLCanvas for Safari
      console.warn('OffscreenCanvas failed, using HTMLCanvas', e);
      return this.initializeWithHTMLCanvas();
    }
  }

  private initializeWithHTMLCanvas(): WebGL2RenderingContext {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('WebGL2 not supported on this device');
    this.canvas = canvas;
    this.context = context;
    return context;
  }

  dispose(): void {
    this.canvas = null;
    this.context = null;
  }
}
```

**Rules**:
1. Singleton pattern for shared services
2. Always provide JSDoc for public methods
3. Always include error handling
4. Always include disposal/cleanup methods

---

# TESTING REQUIREMENTS

## Test File Structure

```typescript
// src/services/__tests__/OffscreenCanvasService.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OffscreenCanvasService } from '../OffscreenCanvasService';

describe('OffscreenCanvasService', () => {
  let service: OffscreenCanvasService;

  beforeEach(() => {
    service = OffscreenCanvasService.getInstance();
  });

  afterEach(() => {
    service.dispose();
  });

  describe('initialize', () => {
    it('should create OffscreenCanvas successfully', async () => {
      // Arrange
      // Setup any prerequisites

      // Act
      const context = await service.initialize();

      // Assert
      expect(context).toBeDefined();
      expect(context).toBeInstanceOf(WebGL2RenderingContext);
    });

    it('should fallback to HTMLCanvas on OffscreenCanvas failure', async () => {
      // This tests Safari compatibility
      // Vitest can mock OffscreenCanvas to be unavailable
    });

    it('should throw error if WebGL2 not supported', async () => {
      // Mock both OffscreenCanvas and HTMLCanvas to fail
      expect(() => service.initialize()).rejects.toThrow('WebGL2 not supported');
    });
  });

  describe('dispose', () => {
    it('should cleanup resources', async () => {
      await service.initialize();
      service.dispose();
      // Verify canvas and context are null
    });
  });
});
```

## Coverage Targets (by Phase)

| Phase | Target | Critical Paths | Example Files |
|-------|--------|---------------|-|
| **Phase 0** | 60% | OffscreenCanvas, VirtualCamera, React 18 | 4-6 core services |
| **Phase 1** | 70% | Undo, Recorder, AI Analysis | All edit paths |
| **Phase 2** | 80% | E2E critical paths, security | Main user flows |
| **Phase 3** | 85%+ | Infrastructure stability | All code |

## Writing Tests: The Formula

```
1. SETUP (Arrange)
   - Initialize service/component with test data
   - Mock dependencies if needed

2. ACTION (Act)
   - Call the function/method
   - Trigger the behavior

3. ASSERT (Assert)
   - Verify the result matches expectation
   - Check side effects if any

Pattern:
it('should [behavior] when [condition]', () => {
  // Arrange
  const service = new MyService();
  
  // Act
  const result = service.doSomething();
  
  // Assert
  expect(result).toBe(expectedValue);
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Watch mode (auto-rerun on save)
npm test -- --watch

# Run specific test file
npm test OffscreenCanvasService.test.ts

# Run tests matching pattern
npm test -- --grep "should initialize"
```

---

# PR & REVIEW PROCESS

## Code Review Checklist (Reviewer)

**Required Reviews**: 2 people minimum  
**Review Order**: First person (logic/correctness), Second person (safety/performance)

### First Reviewer Checklist (15-20 min)

```
CORRECTNESS:
[ ] Does the code fix the stated problem?
[ ] Is the logic correct? (Walk through mentally)
[ ] Are edge cases handled?
[ ] Is error handling present?

TESTING:
[ ] Is there a test for the happy path?
[ ] Is there a test for the error path?
[ ] Does coverage go up, not down?
[ ] Do all tests pass?

READABILITY:
[ ] Can I understand it without asking questions?
[ ] Are variable names clear?
[ ] Are complex sections commented?
[ ] Would I be able to maintain this?
```

**If ANY checkbox fails**: Request changes with specific comment.

### Second Reviewer Checklist (10-15 min)

```
PERFORMANCE:
[ ] Does this change increase bundle size? (check size-check)
[ ] Are there unnecessary re-renders? (React)
[ ] Are there N+1 queries? (API)
[ ] Is memory being leaked? (check dispose)

SAFETY:
[ ] No hardcoded secrets in code?
[ ] No breaking changes to public APIs?
[ ] No removal of error handling?
[ ] No removal of monitoring/logging?

STANDARDS:
[ ] Follows TypeScript strict mode?
[ ] ESLint passes?
[ ] Commit message explains WHY?
[ ] Code matches team style?
```

**If ANY checkbox fails**: Request changes with specific comment.

### Red Flags (Auto Request Changes)

```
❌ No test coverage
❌ Adds external dependency without justification
❌ Increases bundle size >2% per PR
❌ Removes monitoring or logging
❌ Manual testing only (no automated test)
❌ Commits appear rushed (multiple fixes of same thing)
❌ Breaking changes to public interfaces
❌ Hardcoded values instead of constants
```

## Approving a PR

```
✅ Both reviewers approve
✅ All CI checks pass
✅ Author has addressed all comments
✅ Branch is up to date with main

THEN: Squash merge to main (or rebase if linear history preferred)
```

## PR Merge Commit Message

```
feat: Lazy load AI features for bundle optimization

Main bundle: 498KB → 281KB (-217KB, -43%)
AI features now load only when AI tab clicked
Phase 0 road stop requirement: PASSED

Reviewed-by: @reviewer1, @reviewer2
Tested-by: @author
```

---

# PERFORMANCE & BUNDLE RULES

## Bundle Size Rules (Non-Negotiable)

### Phase 0-1: Main Bundle <350KB

```bash
npm run size-check
# Output: ✅ PASSED (281KB main, 68KB remaining)
```

**If PR increases main bundle >2KB**: Must explain why in PR comment.

**If PR increases main bundle >5KB**: 
- Request changes
- Either remove feature or lazy load it

### Chunk Breakdown (Target)

| Chunk | Target | Phase | Purpose |
|-------|--------|-------|---------|
| `index-*.js` (main) | <350KB | 0-3 | App code + core features |
| `vendor-react-*.js` | ~12KB | - | React + React-DOM |
| `vendor-mui-*.js` | <150KB | - | Material-UI components |
| `ai-features-*.js` | <250KB | 1+ | AI + MediaPipe (lazy) |
| `recording-features-*.js` | <50KB | 1+ | Recorder logic (lazy) |

### Code Review for Performance

**For any change to core services**:

```
Ask:
[ ] Does this add dependencies? (check package.json)
[ ] Does this increase bundle size? (check npm run build)
[ ] Does this loop over data? (is it O(n) or O(n²)?)
[ ] Does this call APIs? (is it debounced/throttled?)
[ ] Does this re-render? (are we using memo/callbacks?)
```

## Memory Rules

**During recording** (target: <300MB):
- Monitor with Chrome DevTools
- No unbounded arrays (cap at 1000 entries)
- Dispose resources in cleanup functions

**During long sessions** (>30 min):
- Memory should stay flat, not grow
- If growing: likely memory leak, add dispose/cleanup

---

# MONITORING & OBSERVABILITY

## Structured Logging

**Rule**: Every new feature must have logging for:
1. Initialization (when it starts)
2. Key decision points (conditionals)
3. Errors (try/catch blocks)

```typescript
// ✅ GOOD LOGGING

class RecorderService {
  async startRecording(): Promise<void> {
    console.log('[Recording] Start recording request', {
      fps: this.targetFps,
      resolution: this.resolution,
      timestamp: new Date().toISOString()
    });

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia();
      console.log('[Recording] Stream acquired', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      // Recording started
      Sentry.captureMessage('recording:started', 'info', {
        extra: { fps: this.targetFps }
      });
    } catch (error) {
      console.error('[Recording] Start failed', { error });
      Sentry.captureException(error);
      throw error;
    }
  }
}

// ❌ BAD LOGGING (Too verbose)
console.log('starting');  // What? Where?
console.log('done');      // Done with what?

// ❌ BAD LOGGING (No context)
if (!stream) throw new Error('No stream');  // What should user do?
```

## Error Handling Pattern

```typescript
// ✅ STANDARD PATTERN

export async function initializeCamera(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1920, height: 1080 },
      audio: false
    });
    
    console.log('[Camera] Initialized successfully', {
      videoTracks: stream.getVideoTracks().length
    });
    
    // Store stream...
  } catch (error) {
    const message = error instanceof DOMException 
      ? error.message 
      : 'Unknown error acquiring camera';
    
    console.error('[Camera] Initialization failed', { message, error });
    
    Sentry.captureException(error, {
      extra: {
        context: 'camera_initialization',
        userAction: 'requested camera access'
      }
    });
    
    // Show user-friendly error
    throw new Error(`Camera access denied. Please check permissions.`);
  }
}
```

## Sentry Integration

**Every error must go to Sentry**:

```typescript
try {
  await doSomething();
} catch (error) {
  Sentry.captureException(error);  // Required
  throw error;  // Re-throw for caller to handle
}
```

**Custom events**:

```typescript
// Track user actions
Sentry.captureMessage('recording:started', 'info', {
  extra: {
    fps: 30,
    duration: 60,
    fileSize: 1024000
  }
});
```

---

# DEPLOYMENT PROCEDURES

## Pre-Deployment Checklist (Before EVERY Deploy)

```bash
# 1. Code is ready
git status  # Clean working directory?
npm run typecheck  # No TypeScript errors?
npm run lint  # No lint errors?

# 2. Tests pass
npm test  # All tests passing?
npm run test:coverage  # Coverage target met?

# 3. Build is good
npm run build  # Builds without warnings?
npm run size-check  # Bundle under limit?

# 4. Manual smoke test
npm run preview
# - Open http://localhost:4173
# - Try key features
# - Check console for errors
# - Test on mobile if possible

# 5. Check Sentry
# Go to https://sentry.io/organizations/lumia
# - Are there new errors? (Investigate if yes)
# - Is error rate normal? (Should be <0.5%)

# 6. Verify staging deployment
# Go to https://lumia-staging.vercel.app
# - Load the app
# - Record a video
# - Apply an effect
# - Check no errors in Sentry

# 7. Only then: Deploy to production
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x
# CI will deploy automatically to production
```

## Rollback Procedure (If Production is on Fire)

```bash
# IMMEDIATE (within 5 minutes):

# 1. Identify the problem
# Go to https://sentry.io - check error rate spike
# Is it ours or user problem?

# 2. Decide: Rollback or Hotfix?
# Rollback if: Unknown cause, complex fix, high risk
# Hotfix if: Simple fix, obvious cause, <5 min

# 3. If ROLLBACK:
vercel rollback  # Reverts to previous version
# Monitor error rate drop (should be immediate)
# Post in #lumia-incidents: "Rolled back to [version]"

# 4. If HOTFIX:
# Create branch from main
git checkout -b fix/p1/production-hotfix
# Make minimal fix
# Test locally thoroughly
# Push and merge
# Deploy again

# 5. POST-INCIDENT (within 24h):
# - Document what went wrong
# - Write test to catch it next time
# - Update runbooks if needed
# - Team retrospective
```

---

# EMERGENCY PROTOCOLS

## If Someone Breaks Main

```
1. IMMEDIATE (Stop the bleeding):
   [ ] Who broke it? Tag them in #lumia-incidents
   [ ] What broke? (specific feature or entire app?)
   [ ] How bad? (1 user affected vs all users?)

2. TRIAGE (30 seconds):
   [ ] Rollback the offending commit? (Usually yes)
   [ ] git revert [commit sha]
   [ ] Push to main
   [ ] Verify in Sentry

3. FIX (Next 30 minutes):
   [ ] Create feature branch from main
   [ ] Fix the issue
   [ ] Write test to catch it
   [ ] PR review (1 person, fast)
   [ ] Merge

4. LEARN (Same day):
   [ ] Slack message: "Here's what happened and how we fixed it"
   [ ] Updated runbook entry
   [ ] New test added to suite
```

## If Tests Are Flaky

**Definition**: Test passes sometimes, fails sometimes.

```
[ ] Don't disable the test
[ ] Fix it:
    1. Run 10 times: npm test -- [test-file] --repeat 10
    2. Find the race condition (timing, async)
    3. Add wait/retries to test
    4. Verify passes 10 times straight

[ ] If can't fix immediately:
    1. Mark as `.skip` with comment:
       it.skip('flaky test - being fixed in #123')
    2. Create GitHub issue: "Fix flaky test: [name]"
    3. Assign to owner
    4. Don't merge until fixed
```

## If Production Metrics Spike

**Monitoring alerts go to #lumia-incidents**:

```
Alert: Error rate >5%
├─ Check: Is it our code or user problem?
│  (Go to Sentry, look at top errors)
│
├─ If our code:
│  [ ] Rollback latest deploy (safest option)
│  [ ] OR: Emergency hotfix (only if obvious)
│
└─ Monitor for 1 hour after fix
   Check: Error rate drops? User feedback?
```

---

# PHASE CHECKPOINTS

## Phase 0 Checkpoint (End of Day 4)

**MUST-HAVE** (all required to proceed):
- ✅ Bundle size <500KB (measured in CI)
- ✅ TypeScript compiles (0 errors)
- ✅ ESLint passes (no errors, warnings OK)
- ✅ Tests pass (no failures)
- ✅ CI/CD pipeline working
- ✅ Sentry configured
- ✅ Secrets not in code

**Sign-off**: Lead engineer confirms all green in standup

## Phase 1 Checkpoint (End of Week 2)

**MUST-HAVE** (all required to launch):
- ✅ Bundle size <400KB
- ✅ Test coverage ≥60%
- ✅ Undo implemented + all tests passing
- ✅ Recorder FPS validated ≥24fps
- ✅ AI analysis rate-limited (debounce + throttle)
- ✅ Deployment pipeline tested end-to-end
- ✅ Sentry receiving real events
- ✅ Runbooks written + reviewed by 2 people

**Sign-off**: Lead engineer + DevOps confirm all green

## Launch Week (Week 3)

**Staging Validation** (1 hour):
```
[ ] Load staging URL
[ ] Record 1-minute video
[ ] Apply all effects
[ ] Export video
[ ] Verify video plays correctly
[ ] Check Sentry (0 errors)
```

**Canary Deployment** (10% traffic):
```
[ ] Monitor error rate (target: <1%)
[ ] Monitor FPS (target: ≥24)
[ ] Monitor memory (target: <300MB)
[ ] Monitor user count

If error rate > 1% for 5 minutes:
  → ROLLBACK immediately
  → Debug in staging
  → Deploy again after fix
```

**Full Deployment** (100% traffic):
```
[ ] Monitor for 1 hour
[ ] Check error rate, FPS, memory
[ ] Check user feedback (Discord, Twitter, etc.)

If all green:
  → 🎉 LAUNCH SUCCESSFUL
```

---

# QUICK REFERENCE: DAILY COMMANDS

```bash
# Start your day
git pull
npm install  # if package.json changed
npm run dev  # start dev server

# Before committing
npm run typecheck
npm run lint
npm test
npm run size-check  # if you touched bundling

# Before pushing
git status
git log -1  # verify commit message

# Before merging (Reviewer)
npm test  # runs all tests
npm run build  # verify no build errors
npm run size-check  # verify no bundle regression

# Before deploying to staging
npm run build:staging
npm run preview  # test locally

# Before deploying to production
npm run build:prod
# Manual testing in staging
# Verify Sentry shows no new errors
```

---

# ESCALATION MATRIX

## Who to Ask When

| Situation | Ask | Expected Response |
|-----------|-----|-------------------|
| "How do I build X feature?" | Lead | Architecture advice, 30 min |
| "My tests are flaky" | Full-Stack dev who wrote tests | Help debugging, 1 hour |
| "Bundle size grew, how to fix?" | Full-Stack dev | Options, 30 min |
| "Sentry is alerting on errors" | DevOps | Investigate, decide if rollback, 15 min |
| "I broke main" | Lead (immediately!) | Decision to rollback, 5 min |
| "CI/CD pipeline failed" | DevOps | Debug, fix, 30 min |
| "Should we ship this?" | Lead | Go/no-go decision, 10 min |
| "I'm blocked on X" | Lead | Help unblock, 30 min |

---

# FINAL RULES (The Non-Negotiables)

1. **Every commit is a safe point** — Can rollback at any time
2. **Every PR has tests** — No exceptions except config/docs
3. **Every change is measured** — Bundle size, test coverage, error rate
4. **Every mistake is learned from** — Broken code → new test → shipped fix
5. **Every person knows the status** — Standup is mandatory, honest
6. **Every decision is documented** — Commit messages explain why
7. **Every rollback is fast** — Under 5 minutes, not 5 hours
8. **Every team member matters** — Code review is respect, not criticism

---

# GETTING STARTED TODAY

1. **Read this handbook** (30 min) ← You're here
2. **Share in #lumia-launch** → "Team, read handbook for standards"
3. **Ask clarifying questions** → "Can we do X?" → Discuss and decide
4. **Commit to standards** → "Agreed, will follow these"
5. **Enforce together** → PRs get rejected if they don't follow
6. **Adjust as needed** → "This rule isn't working, let's change it"

**Remember**: This handbook is a living document. If something isn't working, fix it. The point is alignment, not perfection.

---

**Version 1.0 Approved**: December 11, 2025  
**Next Review**: End of Phase 0 (December 15)  
**Owner**: Lead Engineer  
**Contact**: @lead in Slack for questions or changes
