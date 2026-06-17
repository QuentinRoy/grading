import { expect, test } from "vitest";
import {
	assessmentAggregateCacheTag,
	assessmentForSubmissionCacheTag,
	assessmentForSubmissionQuestionCacheTag,
	assessmentImportCacheTag,
	assessmentProgressForQuestionCacheTag,
	projectCacheTag,
	projectListCacheTag,
	questionListCacheTag,
	submissionListCacheTag,
} from "./cacheTags.ts";

test("list tags name their entity collection", () => {
	expect(projectListCacheTag()).toBe("projects");
	expect(questionListCacheTag()).toBe("questions");
	expect(submissionListCacheTag()).toBe("submissions");
});

test("projectCacheTag scopes to the public Project ID", () => {
	expect(projectCacheTag("p-1")).toBe("projects:p-1");
});

test("assessment aggregate and import tags are distinct", () => {
	expect(assessmentAggregateCacheTag()).toBe("assessments");
	expect(assessmentImportCacheTag()).toBe("assessments:all");
});

test("assessment scope tags nest from submission to question", () => {
	expect(assessmentForSubmissionCacheTag("s-1")).toBe("assessments:s-1");
	expect(
		assessmentForSubmissionQuestionCacheTag({
			submissionId: "s-1",
			questionId: "q-1",
		}),
	).toBe("assessments:s-1:q-1");
});

test("assessmentProgressForQuestionCacheTag scopes to the question", () => {
	expect(assessmentProgressForQuestionCacheTag("q-1")).toBe(
		"assessments:question:q-1",
	);
});
