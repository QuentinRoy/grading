import type { Kysely } from "kysely";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { DB } from "#db/generated/db.ts";
import { createCsvSubmissionExport } from "#export/submissionExport.ts";
import type { ExportOptions } from "#export/submissionExportCsv.ts";
import {
	createTestDb,
	type DisposableTestDatabase,
} from "#test/dbIntegration.ts";
import { createProjectRecord } from "#test/projects.ts";
import { loadAssessmentImportContextFromDb } from "./assessmentImportContext.ts";
import { parseAssessmentsCsv } from "./parseAssessments.ts";
import { prepareAssessmentImport } from "./prepareAssessmentImport.ts";

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

async function createRoundtripFixtureProject(db: Kysely<DB>) {
	const project = await createProjectRecord(
		db,
		"Roundtrip Integration Project",
	);

	const questionId = "q-roundtrip-test";
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

	const booleanRubricId = "r-bool-roundtrip-test";
	const ordinalRubricId = "r-ord-roundtrip-test";
	const numericalRubricId = "r-num-roundtrip-test";

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

	await db
		.insertInto("booleanRubric")
		.values({
			rubricId: rubricRowId.get(booleanRubricId)!,
			marks: 2,
			falseMarks: 0,
		})
		.execute();

	const ordinalRubric = await db
		.insertInto("ordinalRubric")
		.values({ rubricId: rubricRowId.get(ordinalRubricId)! })
		.returning("id")
		.executeTakeFirstOrThrow();

	await db
		.insertInto("ordinalRubricValue")
		.values([
			{ ordinalRubricId: ordinalRubric.id, label: "A", marks: 4 },
			{ ordinalRubricId: ordinalRubric.id, label: "B", marks: 2 },
		])
		.execute();

	await db
		.insertInto("numericalRubric")
		.values({
			rubricId: rubricRowId.get(numericalRubricId)!,
			minScore: 0,
			maxScore: 10,
			minMarks: 0,
			maxMarks: 5,
		})
		.execute();

	const student = await db
		.insertInto("student")
		.values({
			projectId: project.rowId,
			id: "student-roundtrip-1",
			firstName: "Test",
			lastName: "Student",
		})
		.returning("rowId")
		.executeTakeFirstOrThrow();

	const submission = await db
		.insertInto("submission")
		.values({
			projectId: project.rowId,
			type: "individual",
			studentId: student.rowId,
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	const assessment = await db
		.insertInto("assessment")
		.values({
			projectId: project.rowId,
			submissionId: submission.id,
			questionId: questionRow.rowId,
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	const rubricAssessments = await db
		.insertInto("rubricAssessment")
		.values([
			{
				assessmentId: assessment.id,
				rubricId: rubricRowId.get(booleanRubricId)!,
				type: "boolean",
			},
			{
				assessmentId: assessment.id,
				rubricId: rubricRowId.get(ordinalRubricId)!,
				type: "ordinal",
			},
			{
				assessmentId: assessment.id,
				rubricId: rubricRowId.get(numericalRubricId)!,
				type: "numerical",
			},
		])
		.returning(["id", "rubricId"])
		.execute();

	const raByRubricId = new Map(
		rubricAssessments.map((ra) => [ra.rubricId, ra.id]),
	);

	await db
		.insertInto("booleanRubricAssessment")
		.values({
			rubricAssessmentId: raByRubricId.get(rubricRowId.get(booleanRubricId)!)!,
			passed: true,
		})
		.execute();

	await db
		.insertInto("ordinalRubricAssessment")
		.values({
			rubricAssessmentId: raByRubricId.get(rubricRowId.get(ordinalRubricId)!)!,
			selectedLabel: "A",
		})
		.execute();

	await db
		.insertInto("numericalRubricAssessment")
		.values({
			rubricAssessmentId: raByRubricId.get(
				rubricRowId.get(numericalRubricId)!,
			)!,
			score: 7.5,
		})
		.execute();

	return {
		project,
		submissionId: String(submission.id),
		rubricIds: {
			booleanId: booleanRubricId,
			ordinalId: ordinalRubricId,
			numericalId: numericalRubricId,
		},
	};
}

let db: DisposableTestDatabase;

beforeAll(async () => {
	db = await createTestDb();
});

afterAll(async () => {
	await db[Symbol.asyncDispose]();
});

describe.each<{ name: string; options: ExportOptions }>([
	{
		name: "full export",
		options: { includeRubricAssessment: true, includeRubricMarks: true },
	},
	{
		name: "assessment-only export",
		options: { includeRubricAssessment: true, includeRubricMarks: false },
	},
])("$name re-imports into the same project without drift", ({ options }) => {
	test("plan reproduces the seeded assessment values exactly", async () => {
		const fixture = await createRoundtripFixtureProject(db);

		const stream = await createCsvSubmissionExport(
			options,
			fixture.project.id,
			{ db },
		);
		const csv = await readStream(stream);

		const rows = await parseAssessmentsCsv(csv);
		const context = await loadAssessmentImportContextFromDb(db, {
			rows,
			projectId: fixture.project.id,
		});
		const plan = prepareAssessmentImport({ rows, context });

		expect(plan.blockingDiagnostics).toEqual([]);
		expect(plan.writes).toEqual(
			expect.arrayContaining([
				{
					submissionId: fixture.submissionId,
					questionId: "q-roundtrip-test",
					rubric: {
						rubricId: fixture.rubricIds.booleanId,
						type: "boolean",
						passed: true,
					},
				},
				{
					submissionId: fixture.submissionId,
					questionId: "q-roundtrip-test",
					rubric: {
						rubricId: fixture.rubricIds.ordinalId,
						type: "ordinal",
						selectedLabel: "A",
					},
				},
				{
					submissionId: fixture.submissionId,
					questionId: "q-roundtrip-test",
					rubric: {
						rubricId: fixture.rubricIds.numericalId,
						type: "numerical",
						score: 7.5,
					},
				},
			]),
		);
		expect(plan.writes).toHaveLength(3);
		expect(plan.overwrites).toHaveLength(3);
	});
});

test("marks-only export re-import is blocked with no-assessment-columns", async () => {
	const fixture = await createRoundtripFixtureProject(db);

	const stream = await createCsvSubmissionExport(
		{ includeRubricAssessment: false, includeRubricMarks: true },
		fixture.project.id,
		{ db },
	);
	const csv = await readStream(stream);

	const rows = await parseAssessmentsCsv(csv);
	const context = await loadAssessmentImportContextFromDb(db, {
		rows,
		projectId: fixture.project.id,
	});
	const plan = prepareAssessmentImport({ rows, context });

	expect(plan.blockingDiagnostics).toEqual([{ type: "no-assessment-columns" }]);
	expect(plan.writes).toEqual([]);
});
