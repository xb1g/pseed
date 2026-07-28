# ProjectSeed Minimum Viable Safeguarding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish one usable safeguarding package that must be operational before ProjectSeed Batch 1 seats are sold.

**Architecture:** Add a single source-of-truth Markdown policy containing the rules, reporting procedure, briefing, acknowledgement, and launch gate. Link it from the approved ProjectSeed strategy and the repository documentation index so operators, mentors, parents, and reviewers can find the same document.

**Tech Stack:** Markdown documentation, Git, shell-based content and link verification

---

### Task 1: Create the operational safeguarding policy

**Files:**
- Create: `docs/project/PROJECTSEED-SAFEGUARDING.md`
- Reference: `docs/plans/2026-07-28-projectseed-safeguarding-design.md`
- Reference: `docs/project/PROJECTSEED-STRATEGY.md`

**Step 1: Verify the policy does not already exist**

Run:

```bash
test ! -e docs/project/PROJECTSEED-SAFEGUARDING.md
```

Expected: exit 0.

**Step 2: Write the policy**

Create `docs/project/PROJECTSEED-SAFEGUARDING.md` with these sections:

1. Status, owner, effective date, review date, scope, and definitions.
2. A non-negotiable rule near the top: no 1:1 private DMs with minors.
3. Roles and responsibilities, naming Bunyasit Fang as safeguarding lead and
   `seedpassion@gmail.com` as the reporting address.
4. Mentor code of conduct, split into required and prohibited behaviours.
5. Online and in-person communication boundaries.
6. Parent-visible communication requirements.
7. A reporting and response procedure for students, parents, mentors, and staff.
8. A disclosure-handling checklist: listen, do not promise secrecy, do not
   investigate, record facts, preserve evidence, and report immediately.
9. A pre-assignment mentor briefing agenda and record requirements.
10. A signable mentor acknowledgement.
11. A Batch 1 launch gate checklist.
12. Limitations, review triggers, and authoritative source links.

Use "must" for requirements and avoid implying that the policy itself is a
background check, legal review, or complete safeguarding programme.

**Step 3: Check the issue requirements**

Run:

```bash
rg -n "code of conduct|1:1 private|parent|Bunyasit Fang|briefing|Batch 1 launch gate" docs/project/PROJECTSEED-SAFEGUARDING.md
```

Expected: every PS-190 requirement appears in the output.

**Step 4: Review sensitive operational wording**

Confirm manually that the policy:

- treats under-18 participants as minors;
- applies minor safeguards when age is unknown;
- permits mentoring only in official group channels or with a second authorized
  adult present;
- makes student safety the first response priority;
- restricts case information to people who need it;
- requires suspected crimes or immediate danger to be referred externally;
- prevents retaliation against reporters;
- requires signed acknowledgement before mentor assignment.

### Task 2: Make the policy discoverable

**Files:**
- Modify: `docs/project/PROJECTSEED-STRATEGY.md`
- Modify: `docs/README.md`

**Step 1: Link the strategy's safeguarding risk**

Change the PS-190 risk entry in `docs/project/PROJECTSEED-STRATEGY.md` so it links
to `./PROJECTSEED-SAFEGUARDING.md`.

**Step 2: Link the strategy's working rule**

Keep the existing no-private-DM rule concise and add the policy link as the
operational source of truth.

**Step 3: Add the policy to the documentation index**

Add `PROJECTSEED-SAFEGUARDING.md` to the `docs/project/` table in
`docs/README.md` with a short purpose statement.

**Step 4: Verify relative links**

Run:

```bash
test -f docs/project/PROJECTSEED-SAFEGUARDING.md
```

Expected: exit 0.

Run:

```bash
rg -n "PROJECTSEED-SAFEGUARDING\\.md" docs/project/PROJECTSEED-STRATEGY.md docs/README.md
```

Expected: two strategy links and one documentation-index link.

### Task 3: Verify and commit the package

**Files:**
- Verify: `docs/project/PROJECTSEED-SAFEGUARDING.md`
- Verify: `docs/project/PROJECTSEED-STRATEGY.md`
- Verify: `docs/README.md`

**Step 1: Run content checks**

Run:

```bash
rg -n "No 1:1 private DMs|Parent-visible|Safeguarding Lead|Report|briefing|acknowledgement|Batch 1 launch gate" docs/project/PROJECTSEED-SAFEGUARDING.md
```

Expected: all operational controls are present.

**Step 2: Scan changed files for likely credentials**

Run:

```bash
git diff --name-only HEAD | xargs rg -n "(re_[A-Za-z0-9_]{10,}|eyJ[A-Za-z0-9_-]{20,}|DISCORD_BOT_TOKEN=[^y])"
```

Expected: no matches.

**Step 3: Inspect the complete diff**

Run:

```bash
git diff --check
```

Expected: exit 0 with no output.

Run:

```bash
git diff -- docs/project/PROJECTSEED-SAFEGUARDING.md docs/project/PROJECTSEED-STRATEGY.md docs/README.md
```

Expected: only the approved safeguarding package and its links.

**Step 4: Run repository checks**

Run:

```bash
pnpm exec jest --runInBand
```

Expected: 80 test suites pass, with the repository's existing skipped suite and
tests unchanged.

Run:

```bash
pnpm lint
```

Expected: exit 0, or report pre-existing lint failures with exact output.

**Step 5: Commit**

```bash
git add docs/project/PROJECTSEED-SAFEGUARDING.md docs/project/PROJECTSEED-STRATEGY.md docs/README.md
git commit -m "docs(projectseed): add minimum safeguarding policy"
```

### Task 4: Close the operational loop

**Step 1: Verify branch history and status**

Run:

```bash
git status --short --branch
```

Expected: clean worktree on
`bysfang/ps-190-write-minimum-viable-safeguarding-policy-before-batch-1`.

Run:

```bash
git log -4 --oneline
```

Expected: separate security cleanup, design, plan, and policy commits.

**Step 2: Update Linear**

Comment on PS-190 with:

- the policy path;
- the non-negotiable communication rule;
- the named lead and reporting address;
- verification results;
- the reminder that mentor briefing, acknowledgement, and parent notice remain
  real launch-gate actions, not paperwork to complete retroactively.

Move PS-190 to the team's completed status only after all repository verification
passes and there are no unresolved policy placeholders.
