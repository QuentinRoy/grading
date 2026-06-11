# Investigation: caching and loading audit

Status: Current investigation
Date: 2026-06-11
Related: #59, `docs/investigations/2026-05-25-source-structure-and-tech-debt-audit.md`, `docs/investigations/2026-05-26-read-write-separation-and-schema-change-resilience.md`, ADR 0007

## Question

Which current loading, caching, revalidation, and route-boundary mechanisms should be changed to reduce loading time, reduce database requests, improve cache correctness, improve developer experience, and reduce technical debt?

This investigation is intentionally exhaustive and exploratory. It is not an ADR and does not choose a final implementation strategy. It captures the current audit state for #59 so implementation work can be split into smaller, safer issues or PRs.

## Executive summary

The current codebase has already resolved the largest obvious loading problem: the submission overview no longer loads one assessment per question. It now uses a submission-level assessment loader that returns every question's rubric values for the selected submission in one query.

The remaining opportunities are subtler. They are not broad rewrites. They are about making cached read boundaries deliberate, sharing canonical cached sources, avoiding hidden duplicate queries, and making cache invalidation auditable.

Recommended priority order:

1. Centralize cache-tag factories and decide whether each tag is real, especially `questions:${questionId}`.
2. Document the mutation-to-tag invalidation map for all writes that affect project, question, submission, assessment, progress, overview, and import surfaces.
3. Add explicit cache-life policy for core cached loaders instead of relying on mixed implicit defaults.
4. Cache question definition reads, or explicitly document why authoring reads must remain uncached.
5. Share one canonical cached question-row source between question rows, question grids, and question-specific reads.
6. Remove hidden duplicate submission loading from question-scoped assessment progress.
7. Share cached assessment-completion rows across completion projections.
8. Revisit the question-specific grading page boundaries after tag hygiene and query-sharing work, not before.
9. Improve loading UI around grading navigation only where data boundaries justify it.
10. Measure rubric overview scale before changing its architecture.

## Current architecture baseline

### Project route loading

Project-scoped routes use URLs shaped like:

```txt
/projects/[projectId]/[projectSlug]/...
```

The Project ID is authoritative. The Project Slug is cosmetic and may be stale. The project-scoped layout loads the project by Project ID, handles not-found behavior, renders the app shell with the real project name, and mounts `CosmeticSlugReplacement` to patch a stale slug in the browser address bar. This avoids per-page server redirects and avoids doing a database lookup in Proxy or middleware.

This is a good current boundary for #59. Stale slugs should not affect lookup, authorization, cache identity, or rendered data. The cost is one project load at the layout level, but that load is cached and project-scoped route correctness depends on it.

### Persistence and caching layers

ADR 0007 defines the current persistence shape:

- DB Primitives take a required `Kysely<DB>` handle and do database work only.
- App-Level Wrappers own the global `db`, transaction boundaries, and cache invalidation.
- Write wrappers invalidate cache only after their transaction commits.
- Read wrappers own caching, declare cache tags and cache life, and delegate database work to `...FromDb` primitives.

This investigation assumes that shape remains correct. The main concern is that some current read wrappers and page-level cached sections do not yet form a coherent caching map.

### Resolved loading work

`loadSubmissionAssessments` is the clearest resolved #59-adjacent improvement. The submission overview page now loads all rubric assessment values for one submission in a single read and attaches them to question rubrics in memory. This replaces the old pattern where the page loaded one assessment per question.

This should remain the model for route-specific read shapes: load at the natural route boundary when it removes repeated database round trips without hiding cache semantics.

## Coverage map

| Surface | Current state | Main risk | Recommended action |
| --- | --- | --- | --- |
| Project-scoped layout | Cached Project ID lookup plus client-side cosmetic slug correction | Mostly acceptable; repeated project reads only matter if nested pages bypass the cached helper | Keep current boundary |
| Home/projects list | Cached project list | Low risk | Keep current boundary |
| Questions management | Uncached question-definition read with assessment counts | Repeated multi-query authoring route load | Cache or explicitly document why uncached |
| Question-specific grading page | Cached page sections, but overlapping data and hidden submission reload | Core grading navigation may cold-load more data than needed | Fix shared caches and progress loader before route-level rewrite |
| Submission overview page | Consolidated submission assessment read | Depends on shared question/submission/completion caches | Keep shape, improve shared sources |
| Assessments index | Cached route section plus completion projection | Progress rows may be loaded independently elsewhere | Share cached completion rows |
| Dashboard | Project and completion summary reads | Same base completion rows as other pages | Share cached completion rows |
| Rubric overview | Cached full overview read | Scale risk from submissions x rubrics matrix | Measure before refactor |
| Imports | Transaction-owned writes with coarse invalidation | Hard to audit semantic invalidation | Add semantic invalidation helpers/map |
| Interactive assessment saves | Transaction-owned write plus tag updates | Exact tags and coarse tags are hard to review | Centralize tag helpers |

## Findings

### Finding 1: cache-tag vocabulary is not yet a real API

#### Current behavior

`src/db/cacheTags.ts` defines the core tag constants and helpers:

```txt
projects
questions
submissions
assessments
assessments:all
projects:${projectPublicId}
assessments:${submissionId}
assessments:${submissionId}:${questionId}
assessments:question:${questionId}
```

However, several pages still hand-build tag strings directly. The question-specific grading page registers raw strings for question and assessment tags, and the assessments index page registers `"assessments"` directly.

The current tag vocabulary is therefore split across:

- `CACHE_TAGS` constants;
- helper functions such as `projectCacheTag`, `assessmentCacheTag`, and `assessmentQuestionCacheTag`;
- page-level ad-hoc strings;
- read-model helper functions that return arrays of mixed constants and raw template strings.

#### Why this matters

A typo or missing helper call silently breaks invalidation. It is also hard to tell which tags are intentionally part of the cache graph and which are historical artifacts.

The most suspicious case is `questions:${questionId}`. It is registered by question-specific/progress reads, but it is not defined in `cacheTags.ts` and is not clearly invalidated by question-definition writes. Those reads also register coarse `questions`, so correctness currently appears to depend on the coarse tag.

#### Recommendation

Make `cacheTags.ts` the only tag-string factory. Add named helpers for every accepted scope and replace direct strings in `app/` and feature modules.

Candidate helper set:

```ts
projectListCacheTag()
projectCacheTag(projectId)
questionListCacheTag()
questionCacheTag(questionId)
submissionListCacheTag()
assessmentAggregateCacheTag()
assessmentImportCacheTag()
assessmentForSubmissionCacheTag(submissionId)
assessmentForSubmissionQuestionCacheTag({ submissionId, questionId })
assessmentProgressForQuestionCacheTag(questionId)
```

Then decide whether `questionCacheTag(questionId)` is needed. Either:

- make it first-class and invalidate it on question save, delete, reorder if relevant, and question import; or
- remove it and rely on `questionListCacheTag()` until finer granularity is actually needed.

Do not leave it as a raw, partly-invalidated string.

### Finding 2: mutation-to-tag invalidation is implicit

#### Current behavior

Each mutation wrapper invalidates tags locally, but there is no central mutation-to-tag map. The reader must inspect each wrapper to know which pages or read models are refreshed after a write.

Current examples:

- `saveAssessment` invalidates exact assessment, submission assessment, coarse assessments, and question progress tags.
- `saveQuestionDefinition` invalidates questions, assessments, assessments-all, and question progress tags.
- `deleteQuestionDefinition` invalidates questions, assessments, assessments-all, and question progress tags.
- `reorderQuestions` invalidates questions only.
- `saveAssessments` invalidates assessments and assessments-all.
- `saveQuestions` invalidates questions, assessments, and assessments-all.
- `saveStudents` invalidates submissions, assessments, and assessments-all.
- `createProject` revalidates projects and the specific project tag.

#### Why this matters

Cache invalidation is correctness-sensitive. Without an explicit map, new reads can register a tag that no mutation invalidates, or new writes can forget derived projections such as progress, overview, dashboard, or navigation state.

#### Recommendation

Add a mutation-to-tag map before or alongside implementation work. It can live in this investigation at first, then become an ADR/design/reference document once #59 chooses a final strategy.

Candidate map:

```txt
create project
  -> projects
  -> project(projectId)

save assessment
  -> assessment(submission, question)
  -> assessment(submission)
  -> assessments aggregate
  -> assessment progress for question(question)

import assessments
  -> assessments aggregate
  -> assessments import/all
  -> overview/progress tags derived from assessments

save question definition
  -> questions
  -> question(question) if kept
  -> assessments aggregate
  -> assessments import/all
  -> assessment progress for question(question)
  -> old question tags if the question id changed

delete question definition
  -> questions
  -> question(question) if kept
  -> assessments aggregate
  -> assessments import/all
  -> assessment progress for question(question)

reorder questions
  -> questions
  -> any page/read model whose output depends on question order

import questions
  -> questions
  -> question(question) if kept and affected ids are known
  -> assessments aggregate
  -> assessments import/all
  -> progress/overview tags derived from questions

import students/submissions
  -> submissions
  -> assessments aggregate
  -> assessments import/all
  -> progress/overview/navigation tags derived from submissions
```

The map should distinguish individual interactive saves from bulk imports. Bulk imports often cannot cheaply know every affected submission/question pair, so they need an explicit coarse import/all tag rather than accidental over-invalidation.

### Finding 3: cache-life policy is inconsistent or implicit

#### Current behavior

Some cached reads specify `cacheLife`, while others do not.

Examples with explicit cache life:

- project list and individual project loads use a 60-second fallback;
- question rows use a one-hour fallback;
- assessment completion loaders use a 60-second fallback;
- rubric overview uses a 60-second fallback.

Examples without explicit cache life:

- `loadSubmissions`;
- `loadQuestionGrid`;
- `loadQuestionAssessment`;
- `loadSubmissionAssessments`.

#### Why this matters

A missing `cacheLife` may be correct, but right now it is not clear whether each omission is intentional. For #59, the cache lifetime should express a freshness policy:

- stable authoring data can have a longer fallback lifetime if writes reliably invalidate it;
- interactive assessment values should rely on exact tag invalidation, with a conservative fallback;
- progress and overview projections should have short fallback lifetimes because they are derived and user-visible during grading;
- submissions probably behave more like stable roster data than live grading data, but imports must invalidate them reliably.

#### Recommendation

Define a short cache policy and apply it consistently.

Candidate policy:

```txt
projects
  cacheLife: 60 seconds
  invalidated by create/update project

questions and rubric definitions
  cacheLife: 1 hour
  invalidated by question save/delete/reorder/import

submissions
  cacheLife: 1 hour, or 60 seconds if roster imports are frequent during grading
  invalidated by student/submission import

individual assessment values
  cacheLife: explicit and conservative
  invalidated by exact assessment save and bulk assessment import

progress and overview projections
  cacheLife: 60 seconds
  invalidated by assessments, questions, and submissions
```

The exact numbers are less important than making omissions deliberate and reviewable.

### Finding 4: question definition reads are not cached

#### Current behavior

The questions management route loads the project and then calls `loadQuestionDefinitions`. That wrapper directly delegates to `loadQuestionDefinitionsFromDb` and does not use `"use cache"`.

The DB Primitive loads full question/rubric rows and assessment counts by question. This is a multi-query project-level read model.

#### Why this matters

Question management is a normal route, not only a mutation boundary. Reopening it can repeat the full question/rubric load and assessment-count query even though the data changes only through known question and assessment mutations.

Caching this read should be safe if the invalidation map includes:

- question save/delete/reorder/import;
- assessment save/import, because the management page displays linked assessment counts.

#### Recommendation

Add a cached read wrapper for question definitions, unless there is a deliberate product reason for this authoring page to always bypass cache.

Candidate tags:

```txt
questions
assessments
assessments:all if imports are tracked separately
```

Candidate cache life: one hour for question/rubric shape, possibly 60 seconds if assessment-count freshness matters more than route speed.

### Finding 5: question rows and question grid do not share one canonical cached source

#### Current behavior

`loadQuestionRows` is cached and delegates to `loadQuestionRowsFromDb`.

`loadQuestionGrid` is also cached, but it delegates directly to `loadQuestionRowsFromDb` rather than composing `loadQuestionRows`. The comment explains that the wrapper avoids passing a DB handle into a cached function, which is consistent with ADR 0007.

The downside is that normal route reads can produce separate cache entries over the same expensive primitive. `loadQuestionRowsFromDb` resolves the Project Row ID and then runs project-wide queries for questions, rubrics, boolean rubric data, numerical rubric data, and ordinal marks.

#### Why this matters

The cache does not necessarily share the expensive project-wide question/rubric load across:

- question row consumers;
- question grid consumers;
- `loadQuestion`, which calls `loadQuestionRows` and filters in memory;
- submission overview and assessments index pages, which call `loadQuestionGrid`;
- question-specific pages, which call `loadQuestion`.

#### Recommendation

Introduce one canonical cached source for project question rows, then derive rows, grids, and single-question reads from it in production call paths. Keep the `...FromDb` primitive for tests and caller-owned transactions.

Candidate shape:

```ts
async function loadQuestionRowsCached({ projectId }: { projectId: string }) {
  "use cache";
  cacheTags(...questionCacheTags());
  cacheLife({ revalidate: 60 * 60 });
  return loadQuestionRowsFromDb(defaultDb, { projectId });
}

export async function loadQuestionRows(params, { db = defaultDb } = {}) {
  if (db === defaultDb) return loadQuestionRowsCached(params);
  return loadQuestionRowsFromDb(db, params);
}

export async function loadQuestionGrid(params, { db = defaultDb } = {}) {
  const rows = db === defaultDb
    ? await loadQuestionRowsCached(params)
    : await loadQuestionRowsFromDb(db, params);
  return toQuestionGrid(rows);
}
```

The exact implementation should respect ADR 0007 and avoid passing runtime DB handles into cached wrappers.

### Finding 6: `loadQuestion` intentionally loads the whole project question set

#### Current behavior

`loadQuestion` calls `loadQuestionRows({ projectId })` and then finds the requested question in memory.

#### Why this matters

This is a strategic caching tradeoff. On a cold question-specific page, the app loads every question and rubric for the project to render one question. That may be desirable because grading workflows often navigate across questions, and warming the project-level question cache helps nearby routes. It may be wasteful for very large projects or if users mostly edit/grade one question in isolation.

#### Recommendation

Document the intended tradeoff. If the app expects course-sized projects where question/rubric definitions are modest and reused across grading navigation, keep the project-wide cache. If realistic projects can have very large question/rubric sets, add a separate `loadQuestionById` read model with a real `questionCacheTag(questionId)`.

Do not add the single-question read model solely because the current code looks broad. Add it only if expected project size or measurements show that project-wide question loading is a real cost.

### Finding 7: question-scoped progress reloads submissions that the page already loaded

#### Current behavior

The question-specific grading page's rubric section loads:

- question;
- submissions;
- current question/submission assessment values;
- question-scoped assessed rubric counts by submission.

`loadAssessedRubricCountsBySubmissionFromDb` also loads all submissions internally so that it can return zero progress for submissions with no assessments.

#### Why this matters

On a cold question-specific grading page render, submissions can be loaded twice:

```txt
loadSubmissions({ projectId })
loadAssessedRubricCountsBySubmission({ questionId, projectId })
  -> loads submissions again internally
```

This is a hidden duplicate query. It matters because the question-specific grading page is a high-frequency grading surface.

#### Recommendation

Split the progress read model into a database count primitive and a pure completion builder.

Candidate shape:

```ts
loadAssessedRubricCountsForQuestionFromDb(db, { questionId, projectId })
  -> returns totalRubrics and counts for submissions that have rows

buildQuestionProgressBySubmission({ submissions, totalRubrics, counts })
  -> fills missing submissions with 0 completed
```

Then the page can use the submissions it already loaded. This keeps the existing output shape while removing hidden duplicate submission loading.

### Finding 8: assessment-completion projections do not share cached base rows

#### Current behavior

`loadAssessmentCompletionRowsFromDb` is a good shared primitive. It loads the row set needed by `buildAssessmentCompletion`: submissions, questions with rubric counts, and assessment counts.

However, the cached exported projections call the primitive independently:

- `loadAssessmentCompletionBySubmission`;
- `loadAssessmentCompletionSummary`;
- related overview/progress surfaces.

The summary also performs a rubric-assessment count query, so it is not identical to the by-submission projection, but both need the same base completion rows.

#### Why this matters

Dashboard, assessments index, submission overview, and overview/progress routes can cold-load overlapping completion data. Because progress is visible during grading navigation, repeated cold queries can affect perceived loading time.

#### Recommendation

Add a canonical cached base row loader:

```ts
loadAssessmentCompletionRowsCached({ projectId })
```

Then derive projections from those rows:

```ts
loadAssessmentCompletionBySubmission
loadAssessmentCompletionSummary
loadAssessedRubricCountsBySubmission, if it remains project-wide
```

Keep the `...FromDb` primitive for tests and transaction-owned callers.

### Finding 9: submission overview loading is improved, but still combines several project-level reads

#### Current behavior

The submission overview page loads in parallel:

- project;
- submissions;
- question grid;
- assessment completion by submission;
- all assessment values for the selected submission.

This is a good shape compared with the old per-question assessment loading pattern.

#### Remaining gray area

The page still asks for both project-wide progress and all question definitions. That is probably correct for an overview-by-submission route, but it means the route depends heavily on the quality of shared caches for submissions, question grid, and completion rows.

#### Recommendation

Do not rewrite the page into one monolithic loader yet. First improve shared cached sources:

1. canonical cached question rows;
2. explicit cached submissions policy;
3. shared cached completion rows;
4. exact assessment/submission tags.

Only consider a route-specific `loadSubmissionAssessmentPage` read model if measurements show that the page still does repeated uncached work after shared sources are fixed.

### Finding 10: question-specific grading page cache boundaries need a focused review

#### Current behavior

The question-specific grading page is split into cached server sections:

- `QuestionHeaderSection`;
- `SubmissionRubricSection`.

Both need some overlapping data. The overlap is partly intentional because header and rubric content have different invalidation needs.

#### Why this matters

This is the core grading UX. It should optimize for fast navigation across submissions/questions without making cache boundaries invisible.

#### Recommendation

Do not collapse the page into one loader just to deduplicate reads. Review it after Findings 1, 5, 7, and 8:

- If shared cached sources remove the real duplication, keep the section split.
- If the page still cold-loads repeated DB work, extract a route read model.
- If loading UX is the issue, add Suspense boundaries or skeletons around the slower data rather than changing data ownership.

A route-level read model is only justified if it improves measured DB work, testability, or page semantics without collapsing useful cache boundaries.

### Finding 11: imports use coarse invalidation intentionally, but helper semantics should be clearer

#### Current behavior

Interactive assessment saves use `updateTags` through helper functions. Import wrappers call `revalidateTag` directly after their transaction commits.

This may be correct because imports are request-scoped and bulk operations may not know every affected granular scope cheaply. The current comments also note that `revalidateTag` is safe only from those request-scoped import actions.

#### Why this matters

The low-level invalidation mechanism differs across write paths. That increases review cost and makes it harder to see whether a mutation invalidates semantic data or only happens to call the right Next.js primitive.

#### Recommendation

Hide the low-level `updateTag` / `revalidateTag` choice behind semantic invalidation helpers:

```ts
invalidateInteractiveAssessmentSave(...)
invalidateAssessmentImport(...)
invalidateQuestionDefinitionSave(...)
invalidateQuestionImport(...)
invalidateStudentImport(...)
```

These helpers should be small and boring. Their value is reviewability, not abstraction for its own sake.

### Finding 12: rubric overview is cached, but scale risk remains

#### Current behavior

`loadRubricOverviewData` is cached, tags questions/submissions/assessments, loads submissions, question grid, and all rubric assessment records, then builds overview data in memory.

#### Why this matters

For small and medium projects, this is probably fine. For large classes and many rubrics, the expensive part may become data volume, serialization, and client rendering rather than cache misses.

The overview includes a student matrix. Matrix-like views can become large as submissions x rubrics grows.

#### Recommendation

Do not refactor this blindly. Add measurement before architecture work:

- realistic number of submissions;
- realistic number of questions/rubrics;
- server query time;
- serialized payload size;
- client render time for `RubricAnalyticsTable` and `StudentMatrix`.

If slow, candidate improvements include:

- separate summary metrics from the full matrix;
- defer or virtualize the student matrix;
- add a dedicated read projection that returns only the data the first viewport needs;
- keep the current cached full-data path for export-like or diagnostic use if needed.

### Finding 13: project-scoped tags may become necessary, but should not be first

#### Current behavior

Many tags are coarse across all projects: `questions`, `submissions`, `assessments`, `assessments:all`.

#### Why this matters

A mutation in one project can invalidate cached data for other projects. In a single-user local course tool, that may be acceptable. If the app grows to many active projects, it can cause avoidable cache churn and slower navigation.

#### Recommendation

Do not introduce project-scoped tags until tag factories are centralized. But design the helper API so project scoping can be added later without touching every page.

Possible future shape:

```txt
questions:${projectId}
submissions:${projectId}
assessments:${projectId}
assessments:${projectId}:${submissionId}
assessments:${projectId}:${submissionId}:${questionId}
assessments:question:${projectId}:${questionId}
```

Do not mix old and new tag shapes ad hoc. Move to project-scoped tags only as a deliberate migration.

### Finding 14: route-level loading UI is too generic for grading workflows

#### Current behavior

The repository has a root `app/loading.tsx` skeleton. The app shell also has a Suspense fallback for the navigation shell, but assessment page content does not have dedicated loading states that preserve grading context.

#### Why this matters

The high-frequency workflow is grading navigation. A generic page skeleton may not address the felt loading problem if the user loses question/submission context while moving through submissions or questions.

#### Recommendation

Add loading UI only after deciding data boundaries. Target these surfaces first:

- question-specific grading page: preserve header/question context while assessment values and progress load;
- submission overview page: preserve current submission context while assessment values load;
- assessments index: show list/progress skeleton close to the final layout.

A project-scoped `loading.tsx` may still be useful, but more granular Suspense boundaries may matter more for perceived speed.

### Finding 15: navigation drawer export-options state is not a caching problem

#### Current behavior

The app shell drawer owns navigation links, export options in local storage, and export URL construction.

#### Why this matters

This looked like mixed responsibility in the source-structure audit, but it is not currently a loading or caching hotspot. It should not distract #59 unless export options grow or drawer rendering becomes measurably expensive.

#### Recommendation

Leave this alone for #59. Extract `ExportOptionsPanel` or `useExportOptions` only if export options grow beyond the current simple state.

### Finding 16: tests can cover tag helper contracts, but not full Next cache behavior

#### Current behavior

ADR 0007 notes that actual Next.js cache behavior is an end-to-end concern. Unit/integration tests can cover helper output, wrapper delegation, and invalidation calls, but not the full runtime cache.

#### Recommendation

For #59 implementation PRs, test the parts that are stable and cheap:

- pure tag helper outputs;
- mutation-to-tag helper maps;
- read wrapper uses expected tag helper where the test seam permits;
- pure projection builders such as completion/progress builders;
- route read-model outputs if a route loader is extracted.

Do not overfit tests to Next.js internals. Add end-to-end/cache-runtime tests only if a real regression appears or if the framework provides a stable test seam.

## Improvement plan

### Phase 1: make cache behavior auditable

Goal: no hidden tag strings and no unclear invalidation semantics.

Work:

1. Expand `src/db/cacheTags.ts` into the only cache tag factory.
2. Replace raw cache tag strings in app pages and feature loaders.
3. Decide and implement the fate of `questions:${questionId}`.
4. Add a documented mutation-to-tag map.
5. Add or update tests for tag helper output and invalidation helper output.

Acceptance criteria:

- No page-level template string builds a cache tag.
- Every registered tag has a documented invalidating mutation or a documented fallback policy.
- Bulk import tags and interactive save tags are visibly different where needed.

### Phase 2: make cache lifetime deliberate

Goal: every cached loader has an explicit freshness policy.

Work:

1. Define cache-life categories for projects, questions, submissions, assessment values, progress, and overview.
2. Add explicit `cacheLife` where currently omitted or document why omission is intentional.
3. Keep fallback lifetimes conservative for assessment values and progress.

Acceptance criteria:

- Reviewers can tell why each cached loader uses its lifetime.
- No core loader relies on implicit defaults by accident.

### Phase 3: share canonical cached sources

Goal: remove repeated cold DB work caused by separate cached wrappers over the same primitive.

Work:

1. Add a canonical cached question-row source.
2. Derive `loadQuestionRows`, `loadQuestionGrid`, and `loadQuestion` from that source in runtime call paths.
3. Add a cached assessment-completion row source.
4. Derive by-submission and summary projections from that source where practical.
5. Keep `...FromDb` primitives for tests and transaction-owned composition.

Acceptance criteria:

- Runtime reads that need the same project-wide question/rubric rows share one cache entry.
- Runtime reads that need the same completion base rows share one cache entry.
- ADR 0007's rule against passing runtime DB handles into cached wrappers remains intact.

### Phase 4: remove hidden duplicate route queries

Goal: keep route reads locally understandable while avoiding avoidable repeated database requests.

Work:

1. Split question-scoped progress so it can reuse already-loaded submissions.
2. Re-check the question-specific grading page after shared caches are in place.
3. Re-check the submission overview page after shared caches are in place.
4. Extract route-specific read models only where shared caches do not solve the real duplication.

Acceptance criteria:

- Question-specific grading no longer loads submissions twice on a cold render.
- Any remaining repeated read is documented as an intentional cache-boundary tradeoff.
- No monolithic page loader is introduced without a measured or clearly demonstrated benefit.

### Phase 5: improve perceived loading for grading navigation

Goal: reduce visible waiting in the core grading workflow.

Work:

1. Add targeted loading boundaries for assessment pages if route transitions still feel blank after data work.
2. Preserve question/submission context during loading where possible.
3. Avoid generic skeletons that hide the whole workflow context.

Acceptance criteria:

- The grading user keeps enough context during navigation to understand what is loading.
- Loading UI matches the data boundaries chosen in earlier phases.

### Phase 6: measure and then optimize rubric overview

Goal: avoid premature architecture work while not ignoring likely scale risk.

Work:

1. Create realistic data fixtures or a benchmark scenario.
2. Measure server query time, payload size, and client render time.
3. If slow, split summary from matrix and consider matrix virtualization or deferred loading.

Acceptance criteria:

- Any rubric overview refactor is justified by measured scale behavior.
- Small-project behavior remains simple.

## Suggested implementation PR order

1. `cache: centralize tag factories`
2. `cache: document invalidation map`
3. `cache: clarify core cache lifetimes`
4. `questions: cache question definitions`
5. `questions: share cached question rows`
6. `assessments: share completion row cache`
7. `assessments: avoid duplicate submission progress reads`
8. `ui: improve grading loading boundaries`
9. `assessments: measure rubric overview scale`

This order keeps correctness before performance refactors. Tag and invalidation clarity should come first because it reduces the risk of every later caching change.

## Non-goals

- Do not redesign routing or slug canonicalization for #59. The current client-side cosmetic slug correction is aligned with the Project ID model.
- Do not introduce a command bus, repository layer, or deep CQRS structure.
- Do not make route loaders monolithic just to remove repeated function calls.
- Do not move to project-scoped tags before centralizing tag helpers.
- Do not optimize rubric overview before measuring realistic scale.
- Do not add end-to-end cache-runtime tests unless there is a stable test seam or a real regression to guard.
