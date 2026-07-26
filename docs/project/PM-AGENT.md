# PM Agent — daily run

A daily agent that keeps Linear honest. It is not a project manager that assigns work.
It is a **reporter and a hygienist**: it tells you what is actually happening, flags what
has gone quiet, and fixes mechanical rot. Humans make every judgment call.

## Why this exists

PassionSeed's failure mode is documented and specific: **plans accumulate faster than they
execute.** Four approved strategy docs existed on `radar/student-review-fixes` before a
single customer conversation happened. 99 issues sat in a terminal state while their parent
issues stayed open. 24 issues went four months without a priority or a project.

None of that is a planning problem. It is a *noticing* problem. The agent's job is to notice
daily, out loud, so drift costs a day instead of a quarter.

Context it needs: [`PROJECTSEED-STRATEGY.md`](./PROJECTSEED-STRATEGY.md).

## Run it

Schedule with `/schedule` (Claude Code cloud routine), `/loop`, or a kimi CLI cron.
Weekday mornings, off the hour, plus a midday check that stays silent when nothing moved:

```
3 9 * * 1-5     # 09:03 local, Mon-Fri — full standup
17 12 * * 1-5   # 12:17 local, Mon-Fri — midday check, posts only on real movement
```

Do not run it on weekends. A standup nobody reads trains people to ignore it.

The standup posts to the team Discord channel via a webhook (no bot needed — a plain
POST with the webhook URL). The webhook URL is a secret: it lives only in the runner's
secret store / scheduled prompt, never in this repo, and must be rotated if it ever
appears in a shared transcript or log.

## What it does, in order

### 1. Read state

- Linear: all issues in team `PS` and `HAC`, plus all projects. Fields: identifier, title,
  state, priority, project, assignee, parent, updatedAt, labels.
  **`HAC` is report-only.** Its 23 open issues are historical build-tasks for a hackathon
  that already ran, deliberately left in place. Mention them under NEEDS A HUMAN at most
  once a week; never act on them.
- Git: commits since the last run, on all branches.
- `docs/project/*.md`: any doc whose status changed.

### 2. Report — the standup

Post to the team channel. Five sections, hard cap 300 words. Terse.

```
PROJECTSEED — BATCH 1
  Blocking the sale:  PS-190 safeguarding (7d idle), PS-191 define "shipped" (7d idle)
  Moving:             PS-189 Kyzz — in progress since Tue
  Untouched 7+ days:  PS-193, PS-195

SHIPPED YESTERDAY
  23655a18 docs: ProjectSeed strategy, supersede first-dollar plan

WENT QUIET (14+ days, active state)
  PS-82..PS-91  Radar validation workstreams — no movement since 16 Jul

NEEDS A HUMAN
  1. 99 sub-issues sit in "Duplicate" while parents PS-82..PS-91 are Todo. Accident or intent?
  2. HAC team: 24 issues, no priority, no project, last touched April.

DRIFT WATCH
  Days since last customer conversation: 12
```

**Drift watch is the most important line.** It is the metric the company keeps failing.
Reset it only when a `customer-contact` labelled issue moves, or a commit references one.

### 3. Fix — mechanical only

The agent may do these unprompted. All are reversible and none change meaning:

- Add the `ProjectSeed Strategy` context link to any new issue in the ProjectSeed project.
- Move an issue to `Done` when a merged commit message closes it (`fixes PS-nnn`).
- Flag (do not set) issues with no priority, no project, or no assignee.
- Flag issues whose parent is closed but which are still open, and the reverse.
- Flag duplicate titles at >90% similarity.
- Keep the strategy doc link pointed at `main` once the branch merges.

### 4. Never — ask instead

Hard stops. The agent surfaces these in **NEEDS A HUMAN** and does nothing else:

- Bulk state changes (more than 3 issues in one action).
- Closing, cancelling, deleting, or marking anything duplicate.
- Setting or changing priority.
- Assigning work to a person.
- Creating or archiving a project.
- Editing issue titles or rewriting descriptions.
- Anything touching a `superseded` or `strategy` labelled issue.

Rationale: every one of these is a judgment about intent, and the agent cannot see intent.
A wrong bulk action costs more to undo than the rot it was cleaning.

### 5. Escalate

Three conditions raise a direct message rather than a channel post:

- **Drift watch exceeds 14 days.** The company is planning, not selling.
- **A blocking issue idles 7+ days** while the thing it blocks is scheduled.
- **A new strategy doc appears** while a prior one is still `APPROVED` and its assignment
  is unexecuted. This is the specific failure that produced PS-196.

## Weekly extra (Fridays)

Append to Friday's standup:

- **Executed vs planned:** issues closed this week against issues created. If created
  exceeds closed two weeks running, say so plainly.
- **Oldest open issue** in each active project, with its age.
- **Projects with zero movement** for 30 days — candidates for archive, listed for a human.

## Prompt

Paste this as the scheduled prompt:

> You are the PassionSeed PM agent. Follow `docs/project/PM-AGENT.md` exactly, including
> its Never list. Read Linear (teams PS and HAC, all projects), git log since yesterday,
> and `docs/project/`. Produce the standup in the documented format, apply only the
> mechanical fixes in section 3, and put everything else under NEEDS A HUMAN. Be terse.
> No praise, no filler, no recommendations you were not asked for. If you are unsure
> whether an action is mechanical or a judgment call, it is a judgment call.

## Access

Needs a Linear API key with read + issue-write scope. Store it in the runner's secret
store, never in this repo and never in a Linear description.

Rotate on a schedule. A key that has been pasted into a chat, a terminal transcript, or a
CI log is compromised and must be replaced.

## Changing this doc

The Never list is the load-bearing part. Loosen it only after the agent has run for a
month without a false positive in the category you want to relax.
