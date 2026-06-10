import { expect, test } from "vitest";
import {
	prepareQuestionImport,
	type QuestionImportContext,
} from "./prepareQuestionImport.ts";
import type { ImportedQuestions } from "./types.ts";

function buildContext(
	overrides: Partial<QuestionImportContext> = {},
): QuestionImportContext {
	return { existingRubricsById: new Map(), ...overrides };
}

test("prepareQuestionImport plans question and rubric upserts from parsed questions", () => {
	const questions: ImportedQuestions = [
		{
			id: "q1",
			label: "Question 1",
			rubrics: [{ id: "r1", type: "boolean", label: "Rubric 1", marks: 2 }],
		},
	];

	const plan = prepareQuestionImport({ questions, context: buildContext() });

	expect(plan.writes).toEqual(questions);
	expect(plan.blockingDiagnostics).toEqual([]);
	expect(plan.rubricTypeChanges).toEqual([]);
});

test("prepareQuestionImport blocks a rubric type change when assessments are linked", () => {
	const questions: ImportedQuestions = [
		{
			id: "q1",
			label: "Question 1",
			rubrics: [
				{
					id: "r1",
					type: "ordinal",
					label: "Rubric 1",
					marks: { good: 1, bad: 0 },
				},
			],
		},
	];

	const context = buildContext({
		existingRubricsById: new Map([
			["r1", { type: "boolean", questionId: "q1", assessmentCount: 3 }],
		]),
	});

	const plan = prepareQuestionImport({ questions, context });

	expect(plan.blockingDiagnostics).toEqual([
		{
			type: "rubric-type-change-blocked",
			questionId: "q1",
			rubricId: "r1",
			assessmentCount: 3,
		},
	]);
	expect(plan.rubricTypeChanges).toEqual([]);
});

test("prepareQuestionImport allows and reports a rubric type change with no linked assessments", () => {
	const questions: ImportedQuestions = [
		{
			id: "q1",
			label: "Question 1",
			rubrics: [
				{
					id: "r1",
					type: "ordinal",
					label: "Rubric 1",
					marks: { good: 1, bad: 0 },
				},
			],
		},
	];

	const context = buildContext({
		existingRubricsById: new Map([
			["r1", { type: "boolean", questionId: "q1", assessmentCount: 0 }],
		]),
	});

	const plan = prepareQuestionImport({ questions, context });

	expect(plan.blockingDiagnostics).toEqual([]);
	expect(plan.rubricTypeChanges).toEqual([
		{
			questionId: "q1",
			rubricId: "r1",
			fromType: "boolean",
			toType: "ordinal",
		},
	]);
});

test("prepareQuestionImport blocks when an imported rubric id belongs to another question", () => {
	const questions: ImportedQuestions = [
		{
			id: "q2",
			label: "Question 2",
			rubrics: [{ id: "r1", type: "boolean", label: "Rubric 1", marks: 2 }],
		},
	];

	const context = buildContext({
		existingRubricsById: new Map([
			["r1", { type: "boolean", questionId: "q1", assessmentCount: 0 }],
		]),
	});

	const plan = prepareQuestionImport({ questions, context });

	expect(plan.blockingDiagnostics).toEqual([
		{
			type: "rubric-question-mismatch",
			rubricId: "r1",
			importQuestionId: "q2",
			existingQuestionId: "q1",
		},
	]);
});
