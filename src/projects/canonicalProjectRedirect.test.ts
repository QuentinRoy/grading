import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	canonicalProjectPath,
	canonicalProjectRedirect,
	type ProjectRoute,
} from "./canonicalProjectRedirect";

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));

const project = { id: "proj_123", slug: "cs101" };

describe("canonicalProjectPath", () => {
	const cases: Array<[ProjectRoute, string]> = [
		[{ kind: "dashboard" }, "/projects/proj_123/cs101"],
		[{ kind: "assessments" }, "/projects/proj_123/cs101/assessments"],
		[{ kind: "overview" }, "/projects/proj_123/cs101/assessments/overview"],
		[{ kind: "questions" }, "/projects/proj_123/cs101/questions"],
		[{ kind: "importQuestions" }, "/projects/proj_123/cs101/import/questions"],
		[{ kind: "importStudents" }, "/projects/proj_123/cs101/import/students"],
		[
			{ kind: "importAssessments" },
			"/projects/proj_123/cs101/import/assessments",
		],
		[
			{ kind: "submission", submissionId: "sub_42" },
			"/projects/proj_123/cs101/assessments/submissions/sub_42",
		],
		[
			{ kind: "submissionQuestion", submissionId: "sub_42", questionId: "q7" },
			"/projects/proj_123/cs101/assessments/submissions/sub_42/questions/q7",
		],
	];

	it.each(cases)("maps %o to its canonical path", (route, expected) => {
		expect(canonicalProjectPath({ route, project })).toBe(expected);
	});

	// Guards the two targets that had drifted to the wrong page before the
	// rule was centralised (overview -> dashboard, assessments -> overview).
	it("keeps each assessment route on its own page", () => {
		expect(
			canonicalProjectPath({ route: { kind: "overview" }, project }),
		).toContain("/overview");
		expect(
			canonicalProjectPath({ route: { kind: "assessments" }, project }),
		).toMatch(/\/assessments$/);
	});
});

describe("canonicalProjectRedirect", () => {
	beforeEach(() => {
		redirect.mockClear();
	});

	it("does not redirect when the slug already matches", () => {
		canonicalProjectRedirect({
			project,
			requestedSlug: "cs101",
			route: { kind: "overview" },
		});
		expect(redirect).not.toHaveBeenCalled();
	});

	it("redirects to the canonical URL when the slug is stale", () => {
		canonicalProjectRedirect({
			project,
			requestedSlug: "old-name",
			route: { kind: "overview" },
		});
		expect(redirect).toHaveBeenCalledWith(
			"/projects/proj_123/cs101/assessments/overview",
		);
	});

	it("carries deep segments into the canonical URL", () => {
		canonicalProjectRedirect({
			project,
			requestedSlug: "old-name",
			route: { kind: "submission", submissionId: "sub_42" },
		});
		expect(redirect).toHaveBeenCalledWith(
			"/projects/proj_123/cs101/assessments/submissions/sub_42",
		);
	});
});
