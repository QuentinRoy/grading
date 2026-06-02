import { redirect } from "next/navigation";
import type { ProjectSummary } from "#projects/projects.ts";
import { assertNever } from "#utils/utils.ts";
import {
	projectAssessmentSubmissionPath,
	projectAssessmentSubmissionQuestionPath,
	projectAssessmentsPath,
	projectDashboardPath,
	projectImportAssessmentsPath,
	projectImportQuestionsPath,
	projectImportStudentsPath,
	projectOverviewPath,
	projectQuestionsPath,
} from "./projectPaths.ts";

/**
 * Names which project-scoped route a page serves. A page is the only place
 * that knows its full segment set (e.g. `submissionId`, `questionId`), so it
 * declares its route kind here rather than rebuilding the canonical URL
 * itself. Each kind maps 1:1 to a `projectPaths` builder.
 */
export type ProjectRoute =
	| { kind: "dashboard" }
	| { kind: "assessments" }
	| { kind: "overview" }
	| { kind: "questions" }
	| { kind: "importQuestions" }
	| { kind: "importStudents" }
	| { kind: "importAssessments" }
	| { kind: "submission"; submissionId: string }
	| { kind: "submissionQuestion"; submissionId: string; questionId: string };

type ProjectIdentity = Pick<ProjectSummary, "id" | "slug">;

/**
 * The Canonical Project URL for a route: the same page addressed with the
 * project's current Project Slug. `projectPaths` stays the single source of
 * truth for URL strings — this only selects which builder to call.
 */
export function canonicalProjectPath({
	route,
	project,
}: {
	route: ProjectRoute;
	project: ProjectIdentity;
}): string {
	const { id, slug } = project;
	switch (route.kind) {
		case "dashboard":
			return projectDashboardPath(id, slug);
		case "assessments":
			return projectAssessmentsPath(id, slug);
		case "overview":
			return projectOverviewPath(id, slug);
		case "questions":
			return projectQuestionsPath(id, slug);
		case "importQuestions":
			return projectImportQuestionsPath(id, slug);
		case "importStudents":
			return projectImportStudentsPath(id, slug);
		case "importAssessments":
			return projectImportAssessmentsPath(id, slug);
		case "submission":
			return projectAssessmentSubmissionPath(id, slug, route.submissionId);
		case "submissionQuestion":
			return projectAssessmentSubmissionQuestionPath(
				id,
				slug,
				route.submissionId,
				route.questionId,
			);
		default:
			return assertNever(route);
	}
}

/**
 * Redirects to the Canonical Project URL when the request carries a stale
 * Project Slug. The Project ID resolves the project, so a slug mismatch is
 * corrected cosmetically — never treated as not-found.
 */
export function canonicalProjectRedirect({
	project,
	requestedSlug,
	route,
}: {
	project: ProjectIdentity;
	requestedSlug: string;
	route: ProjectRoute;
}): void {
	if (project.slug !== requestedSlug) {
		redirect(canonicalProjectPath({ route, project }));
	}
}
