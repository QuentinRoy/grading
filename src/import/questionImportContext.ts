import "server-only";
import type { Kysely } from "kysely";
import type { DB } from "#db/generated/db.ts";
import type { QuestionImportContext } from "./prepareQuestionImport.ts";
import type { ImportedQuestions } from "./types.ts";

// `db` may be the global client or a caller-supplied transaction. Fetches
// everything prepareQuestionImport() needs, driven by the parsed questions.
export async function loadQuestionImportContextFromDb(
	db: Kysely<DB>,
	{ questions, projectId }: { questions: ImportedQuestions; projectId: string },
): Promise<QuestionImportContext> {
	const project = await db
		.selectFrom("project")
		.select("rowId")
		.where("id", "=", projectId)
		.executeTakeFirstOrThrow();
	const projectRowId = project.rowId;

	const rubricIds = questions.flatMap((question) =>
		question.rubrics.map((rubric) => rubric.id),
	);

	if (rubricIds.length === 0) {
		return { existingRubricsById: new Map() };
	}

	const rubricRows = await db
		.selectFrom("rubric")
		.innerJoin("question", "question.rowId", "rubric.questionId")
		.leftJoin("rubricAssessment", "rubricAssessment.rubricId", "rubric.rowId")
		.where("rubric.projectId", "=", projectRowId)
		.where("rubric.id", "in", rubricIds)
		.select(({ fn }) => [
			"rubric.id",
			"rubric.type",
			"question.id as questionId",
			fn.count<number>("rubricAssessment.id").as("assessmentCount"),
		])
		.groupBy(["rubric.id", "rubric.type", "question.id"])
		.execute();

	const existingRubricsById = new Map(
		rubricRows.map((row) => [
			row.id,
			{
				type: row.type,
				questionId: row.questionId,
				assessmentCount: Number(row.assessmentCount),
			},
		]),
	);

	return { existingRubricsById };
}
