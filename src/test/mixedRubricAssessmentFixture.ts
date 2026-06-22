import type { Kysely } from "kysely";
import type { DB } from "#db/generated/db.ts";
import { createProjectRecord } from "./projects.ts";

function mustGet<TKey, TValue>(map: Map<TKey, TValue>, key: TKey): TValue {
	const value = map.get(key);
	if (value == null) {
		throw new Error(`Fixture setup failed: no value for key "${String(key)}".`);
	}
	return value;
}

export type MixedRubricQuestionFixture = {
	project: { id: string; rowId: number };
	question: {
		id: string;
		rowId: number;
		rubrics: { booleanId: string; ordinalId: string; numericalId: string };
	};
};

// Shared by export and import integration tests: a project with one question
// that has one rubric of each type (boolean/ordinal/numerical). Rubric and
// question ids are project-scoped, so each caller can pick its own ids
// without colliding with other tests' projects.
export async function createMixedRubricQuestionFixtureProject(
	db: Kysely<DB>,
	params: {
		projectName: string;
		questionId: string;
		booleanRubricId: string;
		ordinalRubricId: string;
		numericalRubricId: string;
	},
): Promise<MixedRubricQuestionFixture> {
	const {
		projectName,
		questionId,
		booleanRubricId,
		ordinalRubricId,
		numericalRubricId,
	} = params;
	const project = await createProjectRecord(db, projectName);

	const questionRow = await db
		.insertInto("question")
		.values({
			projectId: project.rowId,
			id: questionId,
			label: "Mixed question",
			position: 0,
		})
		.returning("rowId")
		.executeTakeFirstOrThrow();

	const insertedRubrics = await db
		.insertInto("rubric")
		.values([
			{
				id: booleanRubricId,
				projectId: project.rowId,
				questionId: questionRow.rowId,
				type: "boolean",
				position: 0,
				label: "Boolean",
			},
			{
				id: ordinalRubricId,
				projectId: project.rowId,
				questionId: questionRow.rowId,
				type: "ordinal",
				position: 1,
				label: "Ordinal",
			},
			{
				id: numericalRubricId,
				projectId: project.rowId,
				questionId: questionRow.rowId,
				type: "numerical",
				position: 2,
				label: "Numerical",
			},
		])
		.returning(["id", "rowId"])
		.execute();

	const rubricRowId = new Map(insertedRubrics.map((r) => [r.id, r.rowId]));

	await Promise.all([
		db
			.insertInto("booleanRubric")
			.values({
				rubricId: mustGet(rubricRowId, booleanRubricId),
				marks: 2,
				falseMarks: 0,
			})
			.execute(),
		db
			.insertInto("ordinalRubric")
			.values({ rubricId: mustGet(rubricRowId, ordinalRubricId) })
			.returning("id")
			.executeTakeFirstOrThrow()
			.then((ordinalRubric) =>
				db
					.insertInto("ordinalRubricValue")
					.values([
						{ ordinalRubricId: ordinalRubric.id, label: "A", marks: 4 },
						{ ordinalRubricId: ordinalRubric.id, label: "B", marks: 2 },
					])
					.execute(),
			),
		db
			.insertInto("numericalRubric")
			.values({
				rubricId: mustGet(rubricRowId, numericalRubricId),
				minScore: 0,
				maxScore: 10,
				minMarks: 0,
				maxMarks: 5,
			})
			.execute(),
	]);

	return {
		project: { id: project.id, rowId: project.rowId },
		question: {
			id: questionId,
			rowId: questionRow.rowId,
			rubrics: {
				booleanId: booleanRubricId,
				ordinalId: ordinalRubricId,
				numericalId: numericalRubricId,
			},
		},
	};
}

export async function createStudentFixture(
	db: Kysely<DB>,
	projectRowId: number,
	id: string,
): Promise<{ rowId: number; id: string }> {
	const row = await db
		.insertInto("student")
		.values({
			projectId: projectRowId,
			id,
			firstName: "Test",
			lastName: "Student",
		})
		.returning("rowId")
		.executeTakeFirstOrThrow();
	return { rowId: row.rowId, id };
}

export async function createIndividualSubmissionFixture(
	db: Kysely<DB>,
	projectRowId: number,
	studentRowId: number,
): Promise<{ id: number }> {
	return db
		.insertInto("submission")
		.values({
			projectId: projectRowId,
			type: "individual",
			studentId: studentRowId,
		})
		.returning("id")
		.executeTakeFirstOrThrow();
}

// Inserts one assessment with all three rubric types filled in: boolean
// passed, ordinal "A", numerical 7.5.
export async function addFullAssessmentFixture(
	db: Kysely<DB>,
	params: {
		projectRowId: number;
		submissionId: number;
		questionRowId: number;
		booleanRubricRowId: number;
		ordinalRubricRowId: number;
		numericalRubricRowId: number;
	},
): Promise<void> {
	const assessment = await db
		.insertInto("assessment")
		.values({
			projectId: params.projectRowId,
			submissionId: params.submissionId,
			questionId: params.questionRowId,
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	const rubricAssessments = await db
		.insertInto("rubricAssessment")
		.values([
			{
				assessmentId: assessment.id,
				rubricId: params.booleanRubricRowId,
				type: "boolean",
			},
			{
				assessmentId: assessment.id,
				rubricId: params.ordinalRubricRowId,
				type: "ordinal",
			},
			{
				assessmentId: assessment.id,
				rubricId: params.numericalRubricRowId,
				type: "numerical",
			},
		])
		.returning(["id", "rubricId"])
		.execute();

	const raByRubricId = new Map(
		rubricAssessments.map((ra) => [ra.rubricId, ra.id]),
	);

	await Promise.all([
		db
			.insertInto("booleanRubricAssessment")
			.values({
				rubricAssessmentId: mustGet(raByRubricId, params.booleanRubricRowId),
				passed: true,
			})
			.execute(),
		db
			.insertInto("ordinalRubricAssessment")
			.values({
				rubricAssessmentId: mustGet(raByRubricId, params.ordinalRubricRowId),
				selectedLabel: "A",
			})
			.execute(),
		db
			.insertInto("numericalRubricAssessment")
			.values({
				rubricAssessmentId: mustGet(raByRubricId, params.numericalRubricRowId),
				score: 7.5,
			})
			.execute(),
	]);
}
