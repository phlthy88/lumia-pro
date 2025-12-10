# LUMIA PRO PRODUCTION IMPLEMENTATION PACKET
## Complete Blueprint for 3-Week Launch + 12-Week Hardening

**Version:** 1.0 (Implementation-Ready)  
**Date:** December 10, 2025  
**Target Team:** 3-4 engineers  
**Timeline:** 12 weeks (ship in week 3)  
**Consensus Score:** 7.8/10 production-ready

---

# PART 1: MASTER BLUEPRINT

## 1.1 Project Overview

**Lumia Pro Lens**: Professional real-time video color grading in the browser.

**Current State**:
- ✅ Exceptional code architecture (9/10)
- ✅ Sophisticated WebGL + performance optimization
- ⚠️ Runtime bugs prevent shipping (Safari, undo, recorder FPS)
- ⚠️ No CI/CD pipeline or infrastructure
- ⚠️ Bundle size exceeds production targets
- ✅ Team ready to ship with proper process

**This Packet's Goal**: Get to production in 3 weeks with guardrails and safety nets.

---

## 1.2 Core Directives

These are non-negotiable principles:

### **D1: Shipping is the Feature**
- **Why**: Real user feedback beats theoretical perfection.
- **How**: Fix critical path (Phase 0-1), then monitor & iterate.
- **Success**: Production deploy by Week 3.

### **D2: Guardrails Over Heroics**
- **Why**: Fatigue causes bugs.
- **How**: Automate checks, enforce road stops, rotate on-call.
- **Success**: No 80-hour weeks, team stays healthy.

### **D3: Observability First**
- **Why**: You can't fix what you can't see.
- **How**: Structured logging, dashboards, alerts from day 1.
- **Success**: Production issues surfaced in <5 minutes.

### **D4: Every Change is Tested**
- **Why**: Prevents "invisible breakage."
- **How**: Pre-push hooks, CI gates, manual staging validation.
- **Success**: Zero undetected regressions post-launch.

### **D5: Rollback is Practiced**
- **Why**: When (not if) you need to rollback, you need to be fast.
- **How**: Test rollback monthly, canary deploys, blue-green ready.
- **Success**: Rollback in <5 minutes without data loss.

---

## 1.3 Governance & Ownership

### RACI Matrix

| Task | Lead | Full-Stack | DevOps | QA |
|------|------|-----------|--------|-----|
| Phase 0 bugs | **A** | R | — | C |
| CI/CD pipeline | R | **A** | **A** | — |
| Deployment | **A** | C | **A** | C |
| On-call rotation | **A** | C | C | — |
| Production monitoring | C | C | **A** | R |
| Runbooks | **A** | R | R | — |
| Team training | **A** | — | — | — |

**A** = Accountable (makes decision)  
**R** = Responsible (does work)  
**C** = Consulted (provides input)  
**I** = Informed (kept posted)

### Team Roles

**Lead Engineer** (40h/week, 12 weeks)
- Architecture decisions, code reviews, go/no-go calls
- Required: React, WebGL, production systems experience

**Full-Stack Engineer** (40h/week, weeks 1-8; then 20h/week)
- CI/CD, bundle optimization, E2E tests, deployment
- Required: GitHub Actions, Vite, testing frameworks

**DevOps/QA Engineer** (20h/week, weeks 3-12)
- Monitoring, infrastructure, load testing, staging
- Required: Cloud (Vercel), monitoring tools, Linux basics

**Lead** is accountable for launch decision. **Full-Stack** owns code. **DevOps** owns operations.

---

## 1.4 The 12-Week Plan at a Glance

```
WEEK 1-2: Fix Bugs + Set Up Operations (Phase 0-1)
├─ Phase 0 (Days 1-4): Fix critical blockers
├─ Phase 1 (Days 5-10): Stabilize + deploy pipeline
└─ Go/No-Go: Ready to ship

WEEK 3: SHIP TO PRODUCTION
├─ Staging validation (1 hour)
├─ Canary rollout (10% traffic)
└─ 🚀 LIVE

WEEK 4-8: Monitor + Harden (Phase 2)
├─ E2E tests, security hardening, bundle optimization
└─ Real user feedback guides priorities

WEEK 9-12: Infrastructure + Scaling (Phase 3)
├─ Terraform IaC, documentation, team training
└─ Prepare for next 6 months
```

**Key: Once live (Week 3), continue improving in parallel.**

---

## 1.5 Quality Gates (Hard Road Stops)

These are **BLOCKING** — cannot proceed without them.

### Phase 0 Road Stop (End of Day 4)

```
MUST-HAVE:
✅ OffscreenCanvas guarded (Safari doesn't crash)
✅ Virtual camera shows error gracefully
✅ React 18 downgrade verified on all browsers
✅ ESLint enforced in CI (no || true)
✅ Test coverage enforced (min 60%)
✅ GitHub Actions lint + test + build passing
✅ Snyk scanning active (no high-severity vulns)
✅ Secrets in GitHub Secrets (not in code)

FAILURE: Can't proceed to Phase 1
```

### Phase 1 Road Stop (End of Week 2)

```
MUST-HAVE:
✅ Undo implemented + tested (all edit types)
✅ Recorder FPS matches performance mode
✅ AI analysis rate-limited (debounce + throttle)
✅ Service-worker rate-limited
✅ Deployment pipeline works (staging tested)
✅ Sentry monitoring live (events flowing)
✅ Runbook written + reviewed (2 people sign-off)
✅ Environment variables validated

FAILURE: Delay launch to week 4
```

### Production Launch Road Stop (Week 3)

```
MUST-HAVE:
✅ All Phase 1 items passing
✅ Staging tested 1 hour minimum
✅ Canary error budget: <1% error rate
✅ Team briefed + on-call ready
✅ Rollback procedure tested in last 7 days
✅ Monitoring dashboards live
✅ Runbook on-disk in multiple places

FAILURE: Do NOT launch, loop back to Phase 1
```

### Phase 2 Road Stop (End of Week 8)

```
MUST-HAVE:
✅ Bundle size <350KB (Phase 2 target)
✅ Lighthouse ≥85
✅ Test coverage ≥70%
✅ CSP Report-Only violations: 0
✅ 4+ Cypress E2E tests passing
✅ Zero critical incidents in production for 4 weeks

FAILURE: Don't block further work, but highlight for Phase 3
```

---

## 1.6 Success Metrics

| Metric | Phase 0 | Phase 1 | Launch | Phase 2 | Phase 3 |
|--------|---------|---------|--------|---------|---------|
| **Error Rate** | N/A | <1% | <1% | <0.5% | <0.5% |
| **FPS** | N/A | ≥24 | ≥24 | ≥28 | ≥28 |
| **Memory** | N/A | <300MB | <300MB | <250MB | <250MB |
| **Bundle** | <500KB | <400KB | <400KB | <350KB | <350KB |
| **Lighthouse** | N/A | ≥80 | ≥80 | ≥85 | ≥85 |
| **Coverage** | 60% | 60% | 60% | 70% | 70% |
| **Uptime** | N/A | N/A | 99.5% | 99.9% | 99.9% |

**Green = Go. Red = Stop and fix.**

---

## 1.7 Risk Register

| Risk | Probability | Impact | Owner | Mitigation |
|------|-------------|--------|-------|-----------|
| React 18 downgrade breaks UI | Low | High | Lead | Test on 3 browsers, commit with confidence |
| Safari still crashes (OffscreenCanvas) | Low | High | Lead | Comprehensive Safari testing Day 2 |
| Bundle grows to 600KB | Medium | Medium | Full-Stack | CI gate at 500KB, fail if exceeded |
| Production error rate >5% on day 1 | Medium | High | DevOps | Rollback ready, test staging 1h, canary first |
| On-call person unavailable | Low | High | Lead | Rotation with 2 backups |
| Sentry costs explode | Low | Medium | DevOps | Set budget cap, sample if needed |

---

# PART 2: ENGINEERING PLAYBOOK

## 2.1 Pre-Launch Checklist (Week 1-2)

### Daily Standup (10 min, 9 AM)

**Template**:
```
Lead:    "What's blocking launch?"
Dev 1:   "Undo implementation — 60% done"
Dev 2:   "CI pipeline, Snyk integration — on track"
DevOps:  "Monitoring setup — staging dashboard ready"

Risks:   Any blockers? Any help needed?
Plan:    What gets done by EOD?
```

**Frequency**: Every weekday (skip weekends)

### Weekly Sync (30 min, Friday 4 PM)

**Agenda**:
1. Phase progress (slides, demos)
2. Blockers & how to unblock
3. Staffing/capacity issues
4. Next week focus

### Pre-Staging Checklist (Day 10)

```
Code Quality:
[ ] ESLint: 0 warnings, passes CI
[ ] TypeScript: 0 errors (strict mode)
[ ] Test coverage: ≥60% (enforced in CI)
[ ] All P0 bugs fixed

Performance:
[ ] Bundle size: <400KB (measured in CI)
[ ] Lighthouse: ≥80 (no timeouts)
[ ] FPS: ≥24 on low-end device (tested locally)

Security:
[ ] Snyk: 0 high-severity vulnerabilities
[ ] Secrets: Not in git history (checked with git log -p)
[ ] CSP: local/prod aligned

Operations:
[ ] Deployment pipeline: Works to staging
[ ] Sentry: Configured, receiving test events
[ ] Monitoring: Basic dashboard live
[ ] Runbook: Written, reviewed by 2 people
```

---

## 2.2 Code Review Standards

**Every PR must pass these gates before merge**:

### Automated Checks (CI)
- ✅ ESLint (0 warnings)
- ✅ TypeScript (0 errors)
- ✅ Test coverage (min 60%)
- ✅ Bundle size (max 500KB in Phase 0-1, 400KB in Phase 2)
- ✅ No secrets in code (Snyk, git-secrets)

### Manual Review (2 people required)

**Who reviews what**:
- **Core logic** (controllers, services): Lead + Full-Stack
- **UI components**: Full-Stack + QA
- **DevOps/CI/monitoring**: DevOps + Full-Stack
- **Tests**: Author + reviewer

**Review checklist**:
- [ ] Does this fix the right problem?
- [ ] Will this break anything else?
- [ ] Is it testable? (Is there a test?)
- [ ] Does it follow our code style?
- [ ] Is it observable? (Can we debug it if it breaks?)

**Red flags** (request changes):
- ❌ No test coverage
- ❌ Adds external dependencies without justification
- ❌ Increases bundle size >2% per PR
- ❌ Removes monitoring or logging
- ❌ Manual testing only (no automated test)

---

## 2.3 Testing Standards

### Unit Tests
- **Tool**: Jest
- **Target**: ≥60% coverage (Phase 0-1), ≥70% (Phase 2+)
- **Enforced**: CI will fail if below threshold
- **Pattern**:
  ```typescript
  describe('undo', () => {
    it('should undo the last edit', () => {
      // setup
      // act
      // assert
    });
  });
  ```

### Integration Tests
- **Tool**: Jest (same as unit)
- **Target**: Critical paths (undo, recorder, AI analysis)
- **Pattern**: Test multiple services together
  ```typescript
  it('should record video and apply LUT', async () => {
    // Setup camera + LUT
    // Record 5 seconds
    // Verify output has LUT applied
  });
  ```

### E2E Tests
- **Tool**: Cypress (Phase 2+)
- **Target**: 4+ critical user journeys
- **Patterns**:
  1. Load app → record → export (happy path)
  2. Deny camera → show error → retry → allow
  3. Enable AI → face detection → apply filter
  4. Switch performance mode → verify FPS

---

## 2.4 Deployment Runbook

### Pre-Deployment (1 hour before)

```bash
1. Get latest code
   $ git checkout main
   $ git pull

2. Run full test suite
   $ npm run test

3. Build for staging
   $ npm run build:staging

4. Size check
   $ npm run size-check
   # Must be <400KB (Phase 1) or <350KB (Phase 2)

5. Verify Sentry is connected
   # Go to https://sentry.io, create test error
   # Verify it appears in Sentry UI

6. Staging environment
   $ npm run deploy:staging
   # Wait for Vercel to finish
   # Get staging URL

7. Smoke test (5 min)
   - Load staging URL
   - Record 1-minute video
   - Apply LUT
   - Export
   - Verify file plays correctly
```

### Production Deployment (Canary)

```bash
1. All staging checks passed ✓

2. Create release branch
   $ git checkout -b release/v1.0.0

3. Bump version
   # Update package.json version

4. Build for production
   $ npm run build:prod

5. Deploy to Vercel (10% traffic)
   $ vercel deploy --prod --scale=10%
   # Or use GitHub Actions if set up

6. Monitor for 15 minutes
   - Error rate (Sentry)
   - FPS (custom telemetry)
   - User count (Vercel)
   - Check if error rate > 1% → ROLLBACK

7. If healthy, ramp to 100%
   $ vercel deploy --prod --scale=100%

8. Monitor for 1 hour
   - Error rate, FPS, memory
   - User feedback in Discord/Slack

9. If any critical bug
   $ vercel rollback --prod
   # Blue-green environment ready for instant revert
```

### Rollback (Emergency)

```bash
# If production is on fire, IMMEDIATE rollback:

1. Get previous stable version
   $ git log --oneline | head -5
   # Pick last known-good commit

2. Rollback in Vercel UI
   # OR: vercel rollback --prod

3. Monitor rollback
   - Error rate should drop immediately
   - FPS should stabilize

4. Post-incident (within 24h)
   - Debug why it broke
   - Fix in staging
   - Test thoroughly
   - Deploy again

5. Blameless retrospective
   - What went wrong?
   - How do we prevent it?
   - Update playbooks
```

---

## 2.5 Monitoring & Alerting

### Dashboards (Real-Time)

**Sentry Dashboard** (Error tracking)
- Error rate (target: <1% during launch week)
- Top errors
- Browser/device breakdown
- Alert: >5% error rate → page on-call immediately

**Custom Telemetry** (Performance)
- FPS (target: ≥24)
- Memory usage (target: <300MB)
- AI analysis latency (target: <2s)
- Recording success rate (target: >95%)
- Alert: FPS <20 for >2 minutes → investigate

**Vercel Dashboard** (Infrastructure)
- Request count
- Response time (p95)
- Build status
- Deployment history

**Setup (Week 2)**:
```bash
# Add simple telemetry to app
// src/services/Telemetry.ts
export class Telemetry {
  static logEvent(name: string, data: Record<string, any>) {
    console.log(`[TELEMETRY] ${name}`, data);
    // Send to Sentry custom event
    Sentry.captureMessage(name, 'info', { extra: data });
  }
}

// Usage in components:
Telemetry.logEvent('recording_started', { duration: 30, fps: 60 });
```

---

## 2.6 On-Call Procedures

### Launch Week (24/7 Coverage)

**Rotation**:
- Week 3 (launch): Lead + Full-Stack (split 12h each)
- Week 4-8: Rotate weekly (Full-Stack, then DevOps)

**On-Call Responsibilities**:
1. **Monitor dashboards** (every 5 minutes)
2. **Respond to alerts** (page on-call within 5 minutes)
3. **Triage issues** (critical vs. can-wait)
4. **Communicate** (update team Slack channel)
5. **Rollback if needed** (you have the authority)

### Incident Response Template

```
1. ALERT: Sentry shows >5% error rate
   Time: 14:30 UTC
   Who: Engineer on-call
   Action: Jump to Sentry, find top error

2. INVESTIGATE: "OffscreenCanvas context lost"
   Browsers: Safari only
   Frequency: 2% of sessions
   Severity: HIGH (users can't record)

3. TRIAGE: Is it a regression?
   Previous deploy: 2 hours ago
   Potential cause: React 18 OffscreenCanvas handling

4. DECIDE: Rollback or hotfix?
   Decision: ROLLBACK (faster, safer)
   Time to rollback: 3 minutes

5. EXECUTE: $ vercel rollback --prod
   Verify: Error rate drops from 5% → <0.1%

6. POST-INCIDENT (within 24h):
   - Root cause: React 18 OffscreenCanvas changed
   - Fix: Guard OffscreenCanvas on Safari in code
   - Test: Add Safari integration test
   - Deploy: After testing, deploy fix properly
   - Retrospective: How did we miss this?
```

---

## 2.7 Team Communication

### Channels

- **#lumia-launch**: Phase 0-1 daily updates
- **#lumia-incidents**: Real-time incident updates (during launch)
- **#lumia-general**: General questions, discussions
- **#lumia-monitoring**: Automated alerts from Sentry/Vercel

### Status Reports

**Daily (5 min, to #lumia-launch)**:
```
✅ Phase 0, Day 2 Status
- Undo: 60% done, on track
- CI pipeline: Snyk integrated, GitHub Actions WIP
- Blockers: None
- Next: Complete CI by EOD
```

**Weekly (Friday)**:
```
✅ Week 1 Complete
Completed:
- OffscreenCanvas guarding
- Virtual camera capability gating
- React 18 downgrade

In Progress:
- CI/CD pipeline
- Undo implementation

Next Week:
- Phase 1 stabilization
- Deployment pipeline setup
```

**Launch Day (Minute by minute)**:
```
13:00 UTC: Canary deployed (10% traffic)
13:05 UTC: Monitoring dashboards live, error rate 0.2% ✓
13:10 UTC: First users on canary, FPS stable ✓
13:20 UTC: 1000 users on canary, no critical issues ✓
13:30 UTC: Ramp to 25% traffic
...
14:30 UTC: All traffic on new version, monitoring for 1h
15:30 UTC: 🎉 Launch successful
```

---

# PART 3: IMPLEMENTATION ADDENDUMS

## 3.1 GitHub Actions CI/CD YAML

**Location**: `.github/workflows/ci.yml`

```yaml
name: CI/CD - Lumia Pro

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Snyk for dependency scanning
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      # Check for hardcoded secrets
      - name: Check for secrets
        uses: gitleaks/gitleaks-action@v2

  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: TypeScript check
        run: npm run typecheck
      
      - name: ESLint
        run: npx eslint src --max-warnings 0
      
      - name: Check dependencies
        run: npm run deps:check

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test -- --coverage --bail
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true
          min_coverage: 60
      
      - name: Comment coverage on PR
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test, security]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          # Use staging API for builds (safe default)
          VITE_API_URL: https://staging-api.example.com
      
      - name: Check bundle size
        run: npm run size-check
        # Script should fail if bundle > 500KB (Phase 0-1) or > 400KB (Phase 2)
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: './.github/lightthouserc.json'
          uploadArtifacts: true
      
      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist
          retention-days: 7

  e2e:
    name: E2E Tests (Cypress)
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run Cypress
        uses: cypress-io/github-action@v6
        with:
          start: npm run preview
          spec: cypress/e2e/**/*.cy.ts
          browser: chrome
          record: false
          # Or enable recording:
          # record: true
          # key: ${{ secrets.CYPRESS_RECORD_KEY }}
      
      - name: Upload Cypress videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-videos
          path: cypress/videos

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build, e2e]
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Install Vercel CLI
        run: npm i -g vercel
      
      - name: Deploy to Vercel (staging)
        run: |
          vercel deploy \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --scope=${{ secrets.VERCEL_ORG_ID }} \
            --env VITE_API_URL=https://staging-api.example.com
      
      - name: Comment PR with staging URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Staged at https://lumia-staging.vercel.app'
            })

  deploy-production:
    name: Deploy to Production (Manual)
    runs-on: ubuntu-latest
    needs: [build, e2e]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://lumia-pro.app
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel (production)
        run: |
          vercel deploy \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --prod \
            --scope=${{ secrets.VERCEL_ORG_ID }}
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ Lumia Pro deployed to production",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "🚀 *Production Deployed*\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"
                  }
                }
              ]
            }
```

---

## 3.2 Package.json Scripts

**Add these to `package.json`**:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:staging": "VITE_ENV=staging vite build",
    "build:prod": "VITE_ENV=production vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "size-check": "node scripts/check-bundle-size.js",
    "deps:check": "npm audit",
    "e2e": "cypress open",
    "e2e:run": "cypress run",
    "deploy:staging": "vercel deploy --scope=$VERCEL_ORG_ID",
    "deploy:prod": "vercel deploy --prod --scope=$VERCEL_ORG_ID"
  }
}
```

---

## 3.3 Bundle Size Check Script

**Location**: `scripts/check-bundle-size.js`

```javascript
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');

function getSize(file) {
  const stats = fs.statSync(file);
  return stats.size;
}

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

// Find main bundle
const files = fs.readdirSync(distDir);
const mainBundle = files.find(f => f.startsWith('index') && f.endsWith('.js'));

if (!mainBundle) {
  console.error('❌ No main bundle found');
  process.exit(1);
}

const mainPath = path.join(distDir, mainBundle);
const mainSize = getSize(mainPath);

// Thresholds based on phase (set via env var or default)
const phase = process.env.PHASE || '1';
const maxSize = phase === '2' ? 350 * 1024 : 400 * 1024; // KB

console.log(`\n📦 Bundle Size Report`);
console.log(`─────────────────────`);
console.log(`Main bundle: ${formatBytes(mainSize)}`);
console.log(`Max allowed: ${formatBytes(maxSize)}`);

if (mainSize > maxSize) {
  console.error(`\n❌ FAILED: Bundle exceeds limit by ${formatBytes(mainSize - maxSize)}`);
  process.exit(1);
} else {
  const remaining = maxSize - mainSize;
  console.log(`✅ PASSED (${formatBytes(remaining)} remaining)\n`);
  process.exit(0);
}
```

---

## 3.4 Pre-Push Hook

**Location**: `.husky/pre-push`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Pre-push checks..."

# 1. TypeScript
echo "  → TypeScript..."
npm run typecheck || exit 1

# 2. Lint
echo "  → Linting..."
npx eslint src --max-warnings 0 || exit 1

# 3. Tests (fail on first failure)
echo "  → Tests..."
npm test -- --bail || exit 1

# 4. Bundle size
echo "  → Bundle size..."
npm run size-check || exit 1

echo "\n✅ All checks passed, pushing...\n"
```

**Setup**:
```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-push "bash .husky/pre-push"
chmod +x .husky/pre-push
```

---

## 3.5 Sentry Configuration

**Location**: `src/config/sentry.ts`

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initializeSentry() {
  const isDev = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  Sentry.init({
    // Only enable in staging/production
    enabled: !isDev || process.env.SENTRY_ENABLED === 'true',
    
    dsn: import.meta.env.VITE_SENTRY_DSN,
    
    environment: import.meta.env.VITE_ENV || 'development',
    
    release: import.meta.env.VITE_APP_VERSION,
    
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Set traces sample rate lower in production
    tracesSampleRate: isProduction ? 0.1 : 0.5,
    
    // Capture 100% of errors
    attachStacktrace: true,
    
    // Only send errors in production
    beforeSend(event) {
      if (!isProduction && event.level === 'error') {
        // In dev, also log to console
        console.error('[Sentry]', event);
      }
      return event;
    },
  });
}

// Usage in app:
// Sentry.captureException(error);
// Sentry.captureMessage("Something happened");
```

**In `.env.production`**:
```
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
VITE_ENV=production
VITE_APP_VERSION=1.0.0
```

---

## 3.6 Monitoring Dashboard Setup (Grafana)

If using Prometheus + Grafana (Phase 3), here's how to expose metrics:

**Location**: `src/services/Metrics.ts`

```typescript
export class Metrics {
  private static counts: Record<string, number> = {};
  private static timings: Record<string, number[]> = {};

  static increment(name: string, tags?: Record<string, string>) {
    const key = name + JSON.stringify(tags || {});
    this.counts[key] = (this.counts[key] || 0) + 1;
    
    // Send to Sentry as custom metric
    Sentry.captureMessage(`metric.${name}`, 'info', {
      extra: { value: 1, tags }
    });
  }

  static timing(name: string, duration: number) {
    if (!this.timings[name]) this.timings[name] = [];
    this.timings[name].push(duration);
    
    const avg = this.timings[name].reduce((a, b) => a + b, 0) / this.timings[name].length;
    console.log(`⏱️  ${name}: ${duration}ms (avg: ${avg.toFixed(2)}ms)`);
  }

  static report() {
    return {
      counts: this.counts,
      timings: Object.entries(this.timings).map(([k, v]) => ({
        name: k,
        min: Math.min(...v),
        max: Math.max(...v),
        avg: v.reduce((a, b) => a + b, 0) / v.length,
        p95: v.sort((a, b) => a - b)[Math.floor(v.length * 0.95)]
      }))
    };
  }
}

// Usage:
// Metrics.increment('recording_started');
// Metrics.timing('ai_analysis', duration);
```

---

## 3.7 Production Checklist Template

**Print this and check it off before launch:**

```
PRODUCTION LAUNCH CHECKLIST
Date: _______________
Lead Engineer: _____________________________

CODE QUALITY
─────────────────────────────────────────
[ ] TypeScript: 0 errors (npm run typecheck)
[ ] ESLint: 0 warnings (npx eslint src)
[ ] Test coverage: ≥60% (npm test -- --coverage)
[ ] All P0 bugs fixed and tested
[ ] No console.log() left in code
[ ] No hardcoded API keys or secrets
[ ] Git history clean (no merge commits)

PERFORMANCE
─────────────────────────────────────────
[ ] Bundle size: <400KB (Phase 1) or <350KB (Phase 2)
[ ] Main bundle analyzed with webpack-bundle-analyzer
[ ] Lighthouse: ≥80 (Phase 1) or ≥85 (Phase 2)
  - Performance ≥ ___
  - Accessibility ≥ ___
  - Best Practices ≥ ___
  - SEO ≥ ___
[ ] FPS: ≥24 on low-end GPU (tested locally)
[ ] Memory: <300MB (measured during recording)

SECURITY
─────────────────────────────────────────
[ ] Snyk scan: 0 high-severity vulnerabilities
[ ] Secrets: Not in git history
  Command: git log -p | grep -i "GEMINI\|key\|secret"
  Result: No matches
[ ] CSP headers: Reviewed and justified
  - unsafe-eval: _____ (reason)
  - unsafe-inline: _____ (reason)
[ ] CORS: Correctly configured (no *)
[ ] Dependencies: Audited with npm audit

MONITORING & OPS
─────────────────────────────────────────
[ ] Sentry: Connected and receiving events
  - Test event sent and verified
[ ] Monitoring dashboards: Live and accessible
  - Error rate dashboard: URL ___________
  - Performance dashboard: URL ___________
[ ] Alerts configured:
  - >5% error rate: Pages on-call
  - FPS <20 for >2 min: Investigates
  - Memory >300MB: Logs to Slack
[ ] Deployment pipeline: Tested in staging
[ ] Rollback procedure: Tested <7 days ago
  - Time to rollback: _____ minutes
  - Data integrity: Verified

RUNBOOKS & DOCUMENTATION
─────────────────────────────────────────
[ ] Deployment runbook: Written and reviewed
  - Reviewer 1: _____________________
  - Reviewer 2: _____________________
[ ] Incident response procedure: Documented
[ ] On-call procedures: Distributed to team
[ ] Monitoring dashboard link: In Slack pinned
[ ] Rollback procedure: In shared docs

TEAM READINESS
─────────────────────────────────────────
[ ] Lead engineer: Available (on-call Week 3)
[ ] Full-stack engineer: Available (split duty Week 3)
[ ] DevOps engineer: Monitoring setup (Week 3)
[ ] QA: Testing scripts ready
[ ] Team briefing: Completed (15 min, all attend)
  - Date: _________________
  - Attendees: ___________________
[ ] On-call rotation: Assigned and briefed
  - Week 3: Lead + Full-Stack
  - Week 4: _____________________

FINAL GO/NO-GO
─────────────────────────────────────────
Phase 0 checks: ALL GREEN? [ ] Yes [ ] No
Phase 1 checks: ALL GREEN? [ ] Yes [ ] No
Production checks: ALL GREEN? [ ] Yes [ ] No

DECISION: [ ] GO [ ] NO-GO (explain below)

Reason (if NO-GO): ___________________________
________________________________________________
________________________________________________

Lead Engineer Signature: ______________________
Date: ________________ Time: __________________

Approved by (Product/Leadership): _____________
```

---

## 3.8 Incident Response Template

**Print and have in Slack**:

```
🚨 INCIDENT REPORT

Time: _________________ UTC
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
Reporter: _____________________________

WHAT HAPPENED:
(Brief description of issue)
_______________________________________________
_______________________________________________

IMPACT:
- Users affected: _________
- Services down: __________
- Error rate: __________%
- Duration: _________ minutes

TIMELINE:
14:30 - Alert triggered
14:32 - On-call investigated
14:35 - Root cause identified
14:40 - Fix deployed / Rollback executed

ROOT CAUSE:
(What actually went wrong)
_______________________________________________
_______________________________________________

RESOLUTION:
[ ] Hotfix deployed
[ ] Rollback executed
[ ] Monitoring adjusted
Time to resolution: _________ minutes

ACTION ITEMS:
1. [ ] Fix code to prevent recurrence
2. [ ] Add test case
3. [ ] Update runbooks
4. [ ] Team retrospective (scheduled: _______)

FOLLOW-UP:
Retrospective date: ______________
Post-mortem document: (URL)
Fixes merged: (PR URL)
```

---

## 3.9 Post-Launch Retrospective Template

**Schedule for Friday, Week 4 (1 hour)**:

```
LUMIA PRO LAUNCH RETROSPECTIVE

Date: _________________ (Week 4, Friday)
Attendees: Lead, Full-Stack, DevOps, QA, Product

METRICS (Week 1-3):
─────────────────────
Error rate: ____% (target: <1%)
FPS average: ______ (target: ≥24)
Memory avg: ____MB (target: <300MB)
User count: ________
Uptime: ____% (target: 99.5%)
Critical incidents: _____ (target: 0)

WHAT WENT WELL:
─────────────────────
[ ] Phase 0 completed on time
[ ] CI/CD pipeline was reliable
[ ] Monitoring caught issues early
[ ] Team communication was excellent
[ ] Canary rollout worked smoothly

Details:
_______________________________________________
_______________________________________________

WHAT COULD IMPROVE:
─────────────────────
[ ] Phase 1 took longer than planned
[ ] Staging didn't catch all issues
[ ] Monitoring dashboard was hard to read
[ ] On-call runbook had gaps
[ ] Team fatigue was higher than expected

Details:
_______________________________________________
_______________________________________________

ACTION ITEMS FOR NEXT PHASE:
─────────────────────
1. Owner: ________ Task: ________________ Due: ____
2. Owner: ________ Task: ________________ Due: ____
3. Owner: ________ Task: ________________ Due: ____

RETROSPECTIVE OWNER:
_____________________________

NEXT RETRO: _________________ (Week 8, end of Phase 2)
```

---

# APPENDIX: QUICK REFERENCE

## File Checklist for Phase 0

```
src/
├── components/
│   ├── [no changes needed]
├── services/
│   ├── OffscreenCanvas.ts         ← GUARD IMPORT
│   ├── VirtualCamera.ts           ← ADD GATING
│   ├── Recorder.ts                ← [unchanged Phase 0]
│   └── AIAnalysis.ts              ← [unchanged Phase 0]
├── hooks/
│   └── [no changes needed]
├── config/
│   ├── sentry.ts                  ← NEW (MONITORING)
│   └── csp.ts                     ← ALIGN LOCAL/PROD
└── main.tsx                       ← UPDATE IMPORTS

.github/workflows/
├── ci.yml                         ← NEW (CI/CD)
└── security.yml                   ← NEW (SNYK)

scripts/
├── check-bundle-size.js           ← NEW
└── ...

.husky/
├── pre-push                       ← NEW (TESTS)

.env.production
├── VITE_SENTRY_DSN               ← NEW
├── VITE_ENV=production           ← NEW
└── VITE_GEMINI_API_KEY           ← IN GITHUB SECRETS

package.json
├── scripts updated                ← ADD LINT/TEST/BUILD
├── devDependencies updated        ← ADD SENTRY/JEST
└── version bumped                 ← 0.1.0 → 1.0.0

docs/
├── DEPLOYMENT.md                  ← NEW (RUNBOOKS)
├── MONITORING.md                  ← NEW
├── INCIDENT_RESPONSE.md           ← NEW
└── ON_CALL.md                     ← NEW
```

---

## Success Criteria Dashboard

```
PHASE 0 (Days 1-4):
✅ OffscreenCanvas guarded
✅ Virtual camera gating
✅ React 18 verified
✅ CI/CD pipeline
✅ Snyk scanning
✅ Secrets stored safely

PHASE 1 (Weeks 1-2):
⏳ Undo implementation
⏳ Recorder FPS sync
⏳ AI rate limiting
⏳ Service-worker throttling
⏳ Deployment pipeline
⏳ Sentry monitoring
⏳ Runbooks

LAUNCH (Week 3):
⏳ Staging validated
⏳ Canary deployed
⏳ Monitoring live
⏳ Team on-call ready

PHASE 2 (Weeks 5-8):
⏳ E2E tests (Cypress)
⏳ Security hardening
⏳ Bundle <350KB
⏳ Lighthouse ≥85
⏳ Coverage ≥70%

PHASE 3 (Weeks 9-12):
⏳ Terraform IaC
⏳ Documentation complete
⏳ Team trained
⏳ Infrastructure scalable
```

---

**END OF IMPLEMENTATION PACKET**

Print this and hand to your team. Start with Part 1 (Master Blueprint) to understand the strategy, then move to Part 2 (Playbook) for day-to-day execution, and reference Part 3 (Addendums) for specific code/configs.

**Your team can execute from this immediately. No more planning — execution mode.**
