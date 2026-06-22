import type { Kysely } from "kysely";
import { afterAll, beforeAll, expect, test } from "vitest";
import type { DB } from "#db/generated/db.ts";
import {
	createTestDb,
	type DisposableTestDatabase,
} from "#test/dbIntegration.ts";
import {
	addFullAssessmentFixture,
	createIndividualSubmissionFixture,
	createMixedRubricQuestionFixtureProject,
	createStudentFixture,
} from "#test/mixedRubricAssessmentFixture.ts";
import { createCsvSubmissionExport } from "./submissionExport.ts";

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let content = "";

	while (true) {
		const result = await reader.read();
		if (result.done) break;
		content += decoder.decode(result.value, { stream: true });
	}

	content += decoder.decode();
	return content;
}

async function addSparseAssessment(
	db: Kysely<DB>,
	params: {
		projectRowId: number;
		submissionId: number;
		questionRowId: number;
		booleanRubricRowId: number;
	},
) {
	const assessment = await db
		.insertInto("assessment")
		.values({
			projectId: params.projectRowId,
			submissionId: params.submissionId,
			questionId: params.questionRowId,
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	const rubricAssessment = await db
		.insertInto("rubricAssessment")
		.values({
			assessmentId: assessment.id,
			rubricId: params.booleanRubricRowId,
			type: "boolean",
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	await db
		.insertInto("booleanRubricAssessment")
		.values({ rubricAssessmentId: rubricAssessment.id, passed: false })
		.execute();
}

let db: DisposableTestDatabase;

beforeAll(async () => {
	db = await createTestDb();
});

afterAll(async () => {
	await db[Symbol.asyncDispose]();
});

test("createCsvSubmissionExport snapshots CSV for mixed rubric types and submission states", async () => {
	const { project, question } = await createMixedRubricQuestionFixtureProject(
		db,
		{
			projectName: "Export Integration Project",
			questionId: "q-export-test",
			booleanRubricId: "r-bool-export-test",
			ordinalRubricId: "r-ord-export-test",
			numericalRubricId: "r-num-export-test",
		},
	);

	const rubricRowIds = await db
		.selectFrom("rubric")
		.where("projectId", "=", project.rowId)
		.select(["id", "rowId"])
		.execute();
	const rubricRowId = new Map(rubricRowIds.map((r) => [r.id, r.rowId]));

	const [student1, student2, student3] = await Promise.all([
		createStudentFixture(db, {
			projectRowId: project.rowId,
			id: "student-export-1",
		}),
		createStudentFixture(db, {
			projectRowId: project.rowId,
			id: "student-export-2",
		}),
		createStudentFixture(db, {
			projectRowId: project.rowId,
			id: "student-export-3",
		}),
	]);

	// submission1: fully assessed
	const sub1 = await createIndividualSubmissionFixture(db, {
		projectRowId: project.rowId,
		studentRowId: student1.rowId,
	});
	await addFullAssessmentFixture(db, {
		projectRowId: project.rowId,
		submissionId: sub1.id,
		questionRowId: question.rowId,
		booleanRubricRowId: rubricRowId.get(question.rubrics.booleanId)!,
		ordinalRubricRowId: rubricRowId.get(question.rubrics.ordinalId)!,
		numericalRubricRowId: rubricRowId.get(question.rubrics.numericalId)!,
	});

	// submission2: sparse (boolean only assessed)
	const sub2 = await createIndividualSubmissionFixture(db, {
		projectRowId: project.rowId,
		studentRowId: student2.rowId,
	});
	await addSparseAssessment(db, {
		projectRowId: project.rowId,
		submissionId: sub2.id,
		questionRowId: question.rowId,
		booleanRubricRowId: rubricRowId.get(question.rubrics.booleanId)!,
	});

	// submission3: no assessment at all
	await createIndividualSubmissionFixture(db, {
		projectRowId: project.rowId,
		studentRowId: student3.rowId,
	});

	const stream = await createCsvSubmissionExport(
		{ includeRubricAssessment: true, includeRubricMarks: true },
		project.id,
		{ db },
	);
	const csv = await readStream(stream);

	expect(csv).toMatchSnapshot();
});
