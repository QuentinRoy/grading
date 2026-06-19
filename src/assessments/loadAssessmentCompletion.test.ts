import { expect, test } from "vitest";
import {
	assessedRubricCountsBySubmissionCacheTags,
	assessmentCompletionRowsCacheTags,
} from "./loadAssessmentCompletion.ts";

test("assessedRubricCountsBySubmissionCacheTags scopes invalidation to the given question", () => {
	expect(assessedRubricCountsBySubmissionCacheTags("q-1")).toEqual([
		"submissions",
		"questions",
		"assessments:question:q-1",
		"assessments:all",
	]);
});

test("assessmentCompletionRowsCacheTags declares the coarse submission, question and assessment tags", () => {
	expect(assessmentCompletionRowsCacheTags()).toEqual([
		"submissions",
		"questions",
		"assessments",
	]);
});
