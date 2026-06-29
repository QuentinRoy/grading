import type { ImportedQuestions } from "#imports/types.ts";
import type { RubricType } from "#rubrics/types.ts";

export type ExistingQuestionImportRubric = {
	type: RubricType;
	questionId: string;
	assessmentCount: number;
};

export type QuestionImportContext = {
	// Existing rubrics keyed by rubric id, scoped to the project.
	existingRubricsById: Map<string, ExistingQuestionImportRubric>;
};

export type QuestionImportRubricTypeChange = {
	questionId: string;
	rubricId: string;
	fromType: RubricType;
	toType: RubricType;
};

export type QuestionImportBlockingDiagnostic =
	| {
			type: "rubric-type-change-blocked";
			questionId: string;
			rubricId: string;
			assessmentCount: number;
	  }
	| {
			type: "rubric-question-mismatch";
			rubricId: string;
			importQuestionId: string;
			existingQuestionId: string;
	  };

export type QuestionImportPlan = {
	writes: ImportedQuestions;
	blockingDiagnostics: QuestionImportBlockingDiagnostic[];
	// Rubric type changes that proceed (no linked assessments), reported for the
	// success message.
	rubricTypeChanges: QuestionImportRubricTypeChange[];
};

export function prepareQuestionImport(params: {
	questions: ImportedQuestions;
	context: QuestionImportContext;
}): QuestionImportPlan {
	const { questions, context } = params;
	const blockingDiagnostics: QuestionImportBlockingDiagnostic[] = [];
	const rubricTypeChanges: QuestionImportRubricTypeChange[] = [];

	for (const question of questions) {
		for (const rubric of question.rubrics) {
			const existing = context.existingRubricsById.get(rubric.id);
			if (existing == null) {
				continue;
			}

			if (existing.questionId !== question.id) {
				blockingDiagnostics.push({
					type: "rubric-question-mismatch",
					rubricId: rubric.id,
					importQuestionId: question.id,
					existingQuestionId: existing.questionId,
				});
				continue;
			}

			if (existing.type === rubric.type) {
				continue;
			}

			if (existing.assessmentCount > 0) {
				blockingDiagnostics.push({
					type: "rubric-type-change-blocked",
					questionId: question.id,
					rubricId: rubric.id,
					assessmentCount: existing.assessmentCount,
				});
				continue;
			}

			rubricTypeChanges.push({
				questionId: question.id,
				rubricId: rubric.id,
				fromType: existing.type,
				toType: rubric.type,
			});
		}
	}

	return { writes: questions, blockingDiagnostics, rubricTypeChanges };
}
