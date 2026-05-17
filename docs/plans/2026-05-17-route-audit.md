# Route Audit

Date: 2026-05-17

## Summary

The route tree still contains a full set of legacy top-level pages alongside the new `/projects/[projectSlug]/...` pages. Some legacy routes are intentionally preserved as compatibility entry points, but several of them still render the old global views rather than redirecting into the project-scoped routes.

## Findings

- The old assessment routes are still live at `/assessments`, `/assessments/overview`, `/assessments/submissions/[submissionId]`, and `/assessments/submissions/[submissionId]/questions/[questionId]`. These pages still call the unscoped loaders in `src/db/*`, so they continue to operate against the global dataset.
- The old question-management routes are still live at `/questions` and `/questions/[questionId]/edit`. They remain global and are not scoped to a project.
- The old import routes are still live at `/import/questions`, `/import/students`, and `/import/assessments`. They render the shared import forms directly and do not take a project context.
- The project-scoped import pages under `/projects/[projectSlug]/import/*` validate the project slug, but they still render the same shared import forms without passing any project-specific context into the forms or actions.
- The project-scoped question-management page at `/projects/[projectSlug]/questions` validates the project slug, but it still loads the same global managed question set as `/questions`.
- `/import` itself now redirects to `/`, which makes it a partial shim rather than a real landing page.

## Likely Cleanup Targets

1. Redirect or remove the legacy top-level assessment routes once the project-scoped equivalents cover all navigation paths.
2. Decide whether `/questions` should become a redirect into the active project, or remain a global admin view.
3. Thread project context into the import forms and actions, or make the project-scoped import pages explicit wrappers around global behavior.
4. Update any remaining navigation menus that still point at the legacy routes.

## Cleanup Applied

- The legacy top-level route files under `app/assessments`, `app/questions`, and `app/import` were removed.
- The orphaned import menu component that linked to those routes was removed.
- The question edit action no longer redirects to the deleted `/questions` route.
- No live code currently references the deleted legacy route URLs.
