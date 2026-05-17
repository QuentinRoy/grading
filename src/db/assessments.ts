import "server-only";
import { cacheTag, updateTag } from "next/cache";
import { assertNever } from "../utils/utils";
import { db } from "./kysely";
import type { AssessmentRubricValue } from "./types";

export type SaveAssessmentResult =
  | { success: true }
  | { success: false; error: string };

export type SaveAssessmentParams = {
  submissionId: string;
  questionId: string;
  rubric: AssessmentRubricValue;
};

// Returns typed rubric values for a submission/question assessment.
export async function loadAssessment(
  submissionId: string,
  questionId: string,
): Promise<AssessmentRubricValue[]> {
  "use cache";
  cacheTag(`assessments:${submissionId}:${questionId}`);

  const assessment = await db
    .selectFrom("assessment")
    .where("submissionId", "=", Number(submissionId))
    .where("questionId", "=", questionId)
    .select("id")
    .executeTakeFirst();

  if (!assessment) {
    return [];
  }

  const rubricAssessments = await db
    .selectFrom("rubricAssessment")
    .leftJoin(
      "booleanRubricAssessment",
      "booleanRubricAssessment.rubricAssessmentId",
      "rubricAssessment.id",
    )
    .leftJoin(
      "ordinalRubricAssessment",
      "ordinalRubricAssessment.rubricAssessmentId",
      "rubricAssessment.id",
    )
    .leftJoin(
      "numericalRubricAssessment",
      "numericalRubricAssessment.rubricAssessmentId",
      "rubricAssessment.id",
    )
    .where("rubricAssessment.assessmentId", "=", assessment.id)
    .select([
      "rubricAssessment.rubricId as rubricId",
      "rubricAssessment.type as type",
      "booleanRubricAssessment.passed as passed",
      "ordinalRubricAssessment.selectedLabel as selectedLabel",
      "numericalRubricAssessment.score as score",
    ])
    .execute();

  const result: AssessmentRubricValue[] = [];

  for (const rubricAssessment of rubricAssessments) {
    switch (rubricAssessment.type) {
      case "boolean": {
        if (rubricAssessment.passed == null) {
          break;
        }

        result.push({
          rubricId: rubricAssessment.rubricId,
          type: "boolean",
          passed: rubricAssessment.passed,
        });
        break;
      }
      case "ordinal": {
        if (rubricAssessment.selectedLabel == null) {
          break;
        }

        result.push({
          rubricId: rubricAssessment.rubricId,
          type: "ordinal",
          selectedLabel: rubricAssessment.selectedLabel,
        });
        break;
      }
      case "numerical": {
        if (rubricAssessment.score == null) {
          break;
        }

        result.push({
          rubricId: rubricAssessment.rubricId,
          type: "numerical",
          score:
            typeof rubricAssessment.score === "number"
              ? rubricAssessment.score
              : parseFloat(String(rubricAssessment.score)),
        });
        break;
      }
      default: {
        assertNever(rubricAssessment.type);
      }
    }
  }

  return result;
}

export async function saveAssessment({
  submissionId,
  questionId,
  rubric: rubricValue,
}: SaveAssessmentParams): Promise<SaveAssessmentResult> {
  const rubricId = rubricValue.rubricId;

  const [submission, question, rubric] = await Promise.all([
    db
      .selectFrom("submission")
      .where("id", "=", Number(submissionId))
      .select(["id", "projectId"])
      .executeTakeFirst(),
    db
      .selectFrom("question")
      .where("id", "=", questionId)
      .select(["id", "projectId"])
      .executeTakeFirst(),
    db
      .selectFrom("rubric")
      .leftJoin("ordinalRubric", "ordinalRubric.rubricId", "rubric.id")
      .leftJoin(
        "ordinalRubricValue",
        "ordinalRubricValue.ordinalRubricId",
        "ordinalRubric.id",
      )
      .leftJoin("numericalRubric", "numericalRubric.rubricId", "rubric.id")
      .where("rubric.id", "=", rubricId)
      .select([
        "rubric.id",
        "rubric.type",
        "rubric.questionId",
        "ordinalRubricValue.label",
        "numericalRubric.minScore",
        "numericalRubric.maxScore",
      ])
      .executeTakeFirst(),
  ]);

  if (submission == null || question == null) {
    return { success: false, error: "Submission or question not found." };
  }

  if (submission.projectId !== question.projectId) {
    return { success: false, error: "Submission or question not found." };
  }

  if (rubric == null || rubric.questionId !== question.id) {
    return { success: false, error: "Rubric not found." };
  }

  if (rubric.type !== rubricValue.type) {
    return { success: false, error: "Rubric type mismatch." };
  }

  return db.transaction().execute(async (tx) => {
    await tx
      .insertInto("assessment")
      .values({
        projectId: question.projectId,
        submissionId: submission.id,
        questionId: question.id,
      })
      .onConflict((conflict) =>
        conflict.columns(["submissionId", "questionId"]).doNothing(),
      )
      .execute();

    const existingAssessment = await tx
      .selectFrom("assessment")
      .where("submissionId", "=", submission.id)
      .where("questionId", "=", question.id)
      .select("id")
      .executeTakeFirstOrThrow();

    const assessmentId = existingAssessment.id;

    await tx
      .insertInto("rubricAssessment")
      .values({
        assessmentId,
        rubricId,
        type: rubricValue.type,
      })
      .onConflict((conflict) =>
        conflict
          .columns(["assessmentId", "rubricId"])
          .doUpdateSet({ type: rubricValue.type }),
      )
      .execute();

    const existingRubricAssessment = await tx
      .selectFrom("rubricAssessment")
      .where("assessmentId", "=", assessmentId)
      .where("rubricId", "=", rubricId)
      .select("id")
      .executeTakeFirstOrThrow();

    const rubricAssessmentId = existingRubricAssessment.id;

    async function saveBooleanAssessment(
      value: Extract<AssessmentRubricValue, { type: "boolean" }>,
    ): Promise<void> {
      await Promise.all([
        tx
          .insertInto("booleanRubricAssessment")
          .values({
            rubricAssessmentId,
            passed: value.passed,
          })
          .onConflict((conflict) =>
            conflict
              .column("rubricAssessmentId")
              .doUpdateSet({ passed: value.passed }),
          )
          .execute(),
        tx
          .deleteFrom("ordinalRubricAssessment")
          .where("rubricAssessmentId", "=", rubricAssessmentId)
          .execute(),
        tx
          .deleteFrom("numericalRubricAssessment")
          .where("rubricAssessmentId", "=", rubricAssessmentId)
          .execute(),
      ]);
    }

    async function saveOrdinalAssessment(
      value: Extract<AssessmentRubricValue, { type: "ordinal" }>,
    ): Promise<SaveAssessmentResult | void> {
      const ordinalLabels = await tx
        .selectFrom("ordinalRubricValue")
        .innerJoin(
          "ordinalRubric",
          "ordinalRubric.id",
          "ordinalRubricValue.ordinalRubricId",
        )
        .where("ordinalRubric.rubricId", "=", rubricId)
        .select("ordinalRubricValue.label")
        .execute();

      const allowedValues = ordinalLabels.map((item) => item.label);
      if (!allowedValues.includes(value.selectedLabel)) {
        return { success: false, error: "Invalid ordinal value." };
      }

      await Promise.all([
        tx
          .insertInto("ordinalRubricAssessment")
          .values({
            rubricAssessmentId,
            selectedLabel: value.selectedLabel,
          })
          .onConflict((conflict) =>
            conflict
              .column("rubricAssessmentId")
              .doUpdateSet({ selectedLabel: value.selectedLabel }),
          )
          .execute(),
        tx
          .deleteFrom("booleanRubricAssessment")
          .where("rubricAssessmentId", "=", rubricAssessmentId)
          .execute(),
        tx
          .deleteFrom("numericalRubricAssessment")
          .where("rubricAssessmentId", "=", rubricAssessmentId)
          .execute(),
      ]);
    }

    async function saveNumericalAssessment(
      value: Extract<AssessmentRubricValue, { type: "numerical" }>,
    ): Promise<SaveAssessmentResult | void> {
      const parsed = value.score;
      if (!Number.isFinite(parsed)) {
        return { success: false, error: "Invalid numerical value." };
      }

      const numericalRubricData = await tx
        .selectFrom("numericalRubric")
        .where("rubricId", "=", rubricId)
        .select(["minScore", "maxScore"])
        .executeTakeFirst();

      const minScore =
        numericalRubricData?.minScore != null
          ? Number(numericalRubricData.minScore)
          : null;
      const maxScore =
        numericalRubricData?.maxScore != null
          ? Number(numericalRubricData.maxScore)
          : null;

      if (minScore == null || maxScore == null || maxScore <= minScore) {
        return {
          success: false,
          error: "Numerical rubric bounds are invalid.",
        };
      }

      if (parsed < minScore) {
        return { success: false, error: `Score must be at least ${minScore}.` };
      }
      if (parsed > maxScore) {
        return { success: false, error: `Score must be at most ${maxScore}.` };
      }

      await Promise.all([
        tx
          .insertInto("numericalRubricAssessment")
          .values({
            rubricAssessmentId,
            score: parsed,
          })
          .onConflict((conflict) =>
            conflict
              .column("rubricAssessmentId")
              .doUpdateSet({ score: parsed }),
          )
          .execute(),
        tx
          .deleteFrom("booleanRubricAssessment")
          .where("rubricAssessmentId", "=", rubricAssessmentId)
          .execute(),
        tx
          .deleteFrom("ordinalRubricAssessment")
          .where("rubricAssessmentId", "=", rubricAssessmentId)
          .execute(),
      ]);
    }

    const result = await (async (): Promise<SaveAssessmentResult | void> => {
      switch (rubricValue.type) {
        case "boolean": {
          return await saveBooleanAssessment(rubricValue);
        }
        case "ordinal": {
          return await saveOrdinalAssessment(rubricValue);
        }
        case "numerical": {
          return await saveNumericalAssessment(rubricValue);
        }
        default: {
          return assertNever(rubricValue);
        }
      }
    })();

    if (result != null) {
      return result;
    }

    updateTag(`assessments:${submissionId}:${questionId}`);
    updateTag("assessments");
    updateTag(`assessments:question:${questionId}`);

    return { success: true };
  });
}
