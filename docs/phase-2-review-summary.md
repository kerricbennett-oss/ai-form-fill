# Phase 2 Review Summary

Date: 2026-05-16

## Overall

The latest PR is improved, but I would not call it fully solid yet for PDF export reliability.

Main reason:
- state cleanup is fixed
- preview UX is better
- export fallback and coordinate snapping are still heuristic enough to cause wrong placement or unexpected failures

## Risk Areas

### 1. State Cleanup

Status: Pass

What looks good:
- Export preview state is now cleared in `resetAll()`
- Export preview state is now cleared when new files are loaded

Why this matters:
- stale preview UI will no longer leak into the next session

### 2. Preview Flow

Status: Mostly Pass

What looks good:
- preview is shown before PDF download for flat PDF/image flows
- users can still review the rendered output before committing

Remaining concern:
- the preview only shows what rendered successfully
- it does not prove the matched geometry is semantically correct

### 3. Export Fallback

Status: Fail

Issue:
- the code says it can fall back to summary export after a render failure
- but `buildPdf()` still calls the same render path that can throw

Risk:
- users can still hit a crash instead of a clean fallback
- the warning message can be misleading if the export does not actually degrade gracefully

### 4. Coordinate Snapping

Status: Fail

Issue:
- Claude-generated geometry is still being snapped to the nearest detected box with a very loose distance rule
- there is no strong confidence gate or box-shape validation

Risk:
- a label can still attach to the wrong field on dense or multi-column forms
- the system can look correct while still exporting to the wrong place

## Recommendation

Treat the PR as a step forward, not a final stop.

Best next fix:
- make the fallback truly safe
- tighten coordinate snapping with stronger validation
- require a confidence threshold before accepting a snapped box

## Short Verdict

- State cleanup: good
- Preview UX: good enough for now
- Export fallback: not solid yet
- Geometry matching: not solid yet
