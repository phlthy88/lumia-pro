# LUMIA PRO: TEAM QUICK-START GUIDE
## Day 1 Checklist & Command Reference

**Print this and post in Slack pinned messages**

---

## YOUR ROLE & FIRST TASK

### If You're the **Lead Engineer**

**First 30 minutes**:
- [ ] Read `code-strategy-handbook.md` (Section 1-2: Philosophy + Communication)
- [ ] Create 4 Slack channels: `#lumia-launch`, `#lumia-incidents`, `#lumia-code-review`, `#lumia-monitoring`
- [ ] Post message in `#lumia-launch`:
  ```
  Welcome to Phase 0! 🚀
  
  📖 Our team code strategy: [link to handbook]
  📅 Daily standup: 9 AM sharp, this channel
  🎯 Phase 0 target: Bundle <350KB, Tests 60%+
  
  Questions? Reply here in thread.
  ```

**Daily** (9 AM):
- Run standup (10 min max)
- Update team on blockers
- Make go/no-go decisions

### If You're **Full-Stack Engineer**

**First 30 minutes**:
- [ ] Read `code-strategy-handbook.md` (Sections 3-6: Git, Code Quality, Testing, PRs)
- [ ] Clone repo locally, run:
  ```bash
  npm install
  npm run dev
  npm test
  npm run size-check
  ```
- [ ] Verify everything works

**Phase 0 Focus**:
- Write unit tests (target 60% coverage)
- Lazy load AI and Recorder (if not done)
- Fix any code style issues

### If You're **DevOps/QA Engineer**

**First 30 minutes**:
- [ ] Read `code-strategy-handbook.md` (Sections 8-10: Monitoring, Deployment, Emergency)
- [ ] Set up Sentry and Vercel (if not done)
- [ ] Verify CI/CD pipeline has these jobs:
  ```
  ✅ TypeScript check
  ✅ ESLint
  ✅ Run tests with coverage
  ✅ Build
  ✅ Bundle size check
  ```

**Daily**:
- Monitor Sentry for errors
- Verify CI/CD runs successfully
- Check if any alerts need investigation

---

## DAILY WORKFLOW (Copy This)

### Morning (9 AM)

```bash
# 1. Standup (10 min in #lumia-launch)
# What did you do yesterday?
# What are you doing today?
# What's blocking you?

# 2. Get latest code
git checkout main
git pull

# 3. Start your task
git checkout -b feat/p0/your-feature-name
npm run dev  # Your dev server
```

### During the Day

```bash
# Before committing
npm run typecheck  # Catch TypeScript errors
npm run lint       # Check code style
npm test           # Run tests locally

# Write a test for your feature
# (See handbook section: Testing Requirements)

# Commit your work
git add .
git commit -m "feat: [what you did] (Phase 0)

Why: [briefly explain why this matters]"

# Push to GitHub
git push -u origin feat/p0/your-feature-name

# Open PR on GitHub
# Include testing instructions
# Link to Phase 0 if applicable
```

### Before 5 PM

```bash
# Check if your PR needs anything
# Address code review comments
# Run tests one more time locally

# If PR approved:
# Squash and merge to main
```

### Friday 4 PM

```bash
# Attend weekly sync (30 min)
# Share your progress
# Discuss blockers
# Plan next week
```

---

## COMMAND REFERENCE (Keep Handy)

### Setup

```bash
npm install              # Install dependencies
npm run clean           # Full clean reinstall
npm run dev             # Start dev server (http://localhost:3000)
npm run preview         # Test production build locally
```

### Quality Checks (Run Before Every Commit)

```bash
npm run typecheck       # TypeScript errors (must pass)
npm run lint            # ESLint warnings (warnings OK, errors not OK)
npm test                # Run unit tests (must pass)
npm run test:coverage   # Show test coverage %
npm run size-check      # Bundle size check (must be <350KB)
```

### Building

```bash
npm run build           # Build for production
npm run build:staging   # Build for staging
npm run analyze         # Visualize bundle size
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feat/p0/feature-name

# Check status
git status

# Add changes
git add src/file.ts
git add src/test.test.ts

# Commit with message
git commit -m "feat: Add feature (Phase 0)

Explanation of why this matters."

# Push to GitHub
git push -u origin feat/p0/feature-name

# Update branch with latest main
git fetch origin
git rebase origin/main

# Force push after rebase (only on your branch!)
git push --force-with-lease

# Merge after PR approved
# (Do in GitHub UI: Squash and merge)

# Delete branch after merge
git branch -D feat/p0/feature-name
```

### Testing

```bash
npm test                           # Run all tests
npm test -- OffscreenCanvas        # Run specific test file
npm test -- --watch               # Auto-rerun on change
npm run test:coverage             # Coverage report
npm run test:ui                   # Interactive test UI
```

### Debugging

```bash
# In Chrome DevTools
# Open http://localhost:3000
# F12 → Console, Network, Performance

# Check bundle size
npm run analyze
# Opens visualization in browser

# Check test coverage holes
npm run test:coverage
# Look for red lines in coverage report
```

---

## COMMON SCENARIOS & SOLUTIONS

### "I broke TypeScript, how do I fix it?"

```bash
npm run typecheck
# Shows error locations

# Fix the error, then verify
npm run typecheck
# Should show: "No errors ✓"
```

### "ESLint is complaining, what do I do?"

```bash
npm run lint
# Shows all issues

# Try auto-fix
npm run lint:fix
# Fixes ~70% automatically

# For remaining issues:
# Either fix them manually
# Or add comment (if justified):
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response;
```

### "A test is failing, how do I debug?"

```bash
npm test NameOfTest.test.ts --watch
# Auto-reruns when you save

# In the test file:
it.only('specific test', () => {
  // Will run ONLY this test
})
// Remove .only before commit!

# Add console.log for debugging
console.log('Debug info:', value);
// You'll see it in terminal
```

### "Bundle size increased, what happened?"

```bash
npm run analyze
# Opens visualization

# Look for:
# - New large dependencies?
# - Code that should be lazy loaded?
# - Duplicate code?

# To fix:
# 1. Remove unnecessary import
# 2. Lazy load the feature (import(() => ...))
# 3. Remove dependency if possible
```

### "PR review feedback, how do I update?"

```bash
# Make the requested changes
git add .
git commit -m "fix: Address review feedback"
git push

# GitHub shows updated PR automatically
# Once approved: Merge
```

### "I committed to wrong branch, how do I fix?"

```bash
# You're on: main (but should be on: feat/my-feature)

# Option 1: Create new branch from current commit
git branch feat/my-feature
git push -u origin feat/my-feature
# Then go to GitHub and create PR

# Option 2: Move commits to correct branch
git checkout main
git reset --soft HEAD~1  # Undo commit, keep changes
git checkout -b feat/my-feature
git add .
git commit -m "feat: my change"
git push -u origin feat/my-feature
```

### "Need to revert a commit, how do I do it?"

```bash
# Option 1: If not pushed yet
git reset --soft HEAD~1  # Undo commit, keep changes
git reset --hard HEAD~1  # Undo commit, delete changes

# Option 2: If already pushed
git revert HEAD  # Creates a new "undo" commit
git push
```

---

## SLACK COMMAND REFERENCE

### In #lumia-launch (Daily Status)

**Format**:
```
Day X Status:
- Feature 1: 60% done, no blockers
- Feature 2: 40% done, waiting for review
- Next: Finish Feature 1, start tests
```

**Weekly Update** (Friday EOD):
```
✅ Week 1 Complete
Accomplished:
- Bundle optimization
- UI fixes
- Test infrastructure

Next:
- Test coverage to 60%
- Undo implementation
```

### In #lumia-incidents (Emergencies Only)

**Trigger**: "Production is broken" or "CI/CD failed"

```
🚨 INCIDENT: [what broke]
- Status: INVESTIGATING
- Last working version: v1.0.5
- Impact: Users cannot record
- ETA: 30 minutes

[Update status every 5 min]
```

### In #lumia-code-review (PRs)

**When opening PR**:
```
🔍 PR Ready for Review
Title: feat: Add undo functionality
Link: [PR URL]
Testing instructions: Run `npm test`, then click Edit → Undo
cc/ @reviewer1 @reviewer2
```

---

## WEEKLY CHECKLIST

### Every Friday (4 PM Sync)

```
[ ] Code pushed and merged
[ ] All tests passing
[ ] No pending PRs
[ ] Bundle size check passing
[ ] Sentry has no critical errors
[ ] Commit log is clear (good messages)
[ ] Updated runbook if needed
```

### Every Sunday (Prep for Week)

```
[ ] Read the week's task list
[ ] Understand dependencies (what blocks what)
[ ] Have questions? Ask lead early
[ ] Code locally runs without errors
```

---

## EMERGENCY CONTACTS

| Situation | Who | How | Expect Response |
|-----------|-----|-----|-----------------|
| App is broken in prod | @lead | Slack + call | 5 min |
| CI/CD pipeline down | @devops | Slack + call | 10 min |
| Blocked on code | @lead | Slack | 30 min |
| Test is flaky | Whoever wrote test | Slack | 1 hour |
| Question about handbook | @lead | Slack | 1 hour |

---

## PHASE 0 SUCCESS CRITERIA (READ THIS!)

By end of Friday:

```
✅ Bundle size: 350KB (npm run size-check passes)
✅ Tests: 60% coverage (npm run test:coverage)
✅ TypeScript: 0 errors (npm run typecheck)
✅ ESLint: 0 errors (npm run lint)
✅ All tests pass: (npm test)
✅ No production errors: (Check Sentry)
```

If ALL green: Phase 0 CLEARED, move to Phase 1.

If ANY red: Fix today, don't move forward.

---

## TIPS FOR SUCCESS

✅ **Commit often** (every 30 min)
- Smaller commits = easier to review
- Easier to rollback if needed

✅ **Write tests early** (not at the end)
- Tests document how code should work
- Catch bugs before code review

✅ **Read code reviews seriously**
- Feedback is respect, not criticism
- Ask questions if feedback is unclear

✅ **Run checks before pushing**
- Don't make reviewers wait for CI to catch errors
- `npm run typecheck && npm test && npm run size-check`

✅ **Ask questions early**
- Blocked for 15 min? Ask for help
- Don't waste time stuck

❌ **Don't**:
- Push without running tests locally
- Skip the handbook
- Ignore code review feedback
- Commit huge changes (hard to review)
- Leave debug code/console.log in PR

---

## YOUR FIRST COMMIT TODAY

```bash
# Create your feature branch
git checkout -b feat/p0/first-task

# Make a small change (e.g., add a test)
# Edit src/services/__tests__/Something.test.ts

# Run checks
npm run typecheck
npm test
npm run size-check

# Commit with message
git commit -m "test: Add OffscreenCanvas tests (Phase 0)

Added 3 tests for Safari compatibility guard.
Covers: creation, unavailable state, fallback."

# Push
git push -u origin feat/p0/first-task

# Open PR on GitHub
# Add description + testing instructions
```

**That's it!** You're on the team now. Welcome aboard. 🚀

---

**Questions?** Ask in #lumia-launch. We're all in this together.
