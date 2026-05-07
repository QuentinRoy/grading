"use server";

import { RubricType } from "@prisma/client";
import { updateTag } from "next/cache";
import { prisma } from "./prisma";

export type SaveRubricGradingResult =
  | { success: true }
  | { success: false; error: string };

export async function saveRubricGrading({
  paperId,
  questionId,
  rubricId,
  grading,
}: {
  paperId: string; // externalId
  questionId: string; // externalId
  rubricId: string; // DB id
  grading: string;
}): Promise<SaveRubricGradingResult> {
  const [paper, question, rubric] = await Promise.all([
    prisma.paper.findUnique({ where: { externalId: paperId } }),
    prisma.question.findUnique({ where: { externalId: questionId } }),
    prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        ordinalRubric: {
          select: {
            values: {
              select: {
                label: true,
              },
            },
          },
        },
        numericalRubric: {
          select: { min: true, max: true },
        },
      },
    }),
  ]);

  if (paper == null || question == null) {
    return { success: false, error: "Paper or question not found." };
  }

  if (rubric == null || rubric.questionId !== question.id) {
    return { success: false, error: "Rubric not found." };
  }

  const assessment = await prisma.assessment.upsert({
    where: {
      paperId_questionId: { paperId: paper.id, questionId: question.id },
    },
    create: { paperId: paper.id, questionId: question.id },
    update: {},
  });

  const rubricScore = await prisma.rubricScore.upsert({
    where: {
      assessmentId_rubricId: {
        assessmentId: assessment.id,
        rubricId,
      },
    },
    create: {
      assessmentId: assessment.id,
      rubricId,
      type:
        rubric.type === RubricType.BOOLEAN
          ? RubricType.BOOLEAN
          : rubric.type === RubricType.ORDINAL
            ? RubricType.ORDINAL
            : RubricType.NUMERICAL,
    },
    update: {
      type:
        rubric.type === RubricType.BOOLEAN
          ? RubricType.BOOLEAN
          : rubric.type === RubricType.ORDINAL
            ? RubricType.ORDINAL
            : RubricType.NUMERICAL,
    },
  });

  if (rubric.type === RubricType.BOOLEAN) {
    if (grading !== "passed" && grading !== "failed") {
      return { success: false, error: "Invalid boolean value." };
    }

    await prisma.booleanRubricScore.upsert({
      where: { rubricScoreId: rubricScore.id },
      create: {
        rubricScoreId: rubricScore.id,
        passed: grading === "passed",
      },
      update: { passed: grading === "passed" },
    });
    await prisma.ordinalRubricScore.deleteMany({
      where: { rubricScoreId: rubricScore.id },
    });
    await prisma.numericalRubricScore.deleteMany({
      where: { rubricScoreId: rubricScore.id },
    });
  } else if (rubric.type === RubricType.ORDINAL) {
    const allowedValues =
      rubric.ordinalRubric?.values.map((item) => item.label) ?? [];

    if (!allowedValues.includes(grading)) {
      return { success: false, error: "Invalid ordinal value." };
    }

    await prisma.ordinalRubricScore.upsert({
      where: { rubricScoreId: rubricScore.id },
      create: {
        rubricScoreId: rubricScore.id,
        selectedLabel: grading,
      },
      update: { selectedLabel: grading },
    });
    await prisma.booleanRubricScore.deleteMany({
      where: { rubricScoreId: rubricScore.id },
    });
    await prisma.numericalRubricScore.deleteMany({
      where: { rubricScoreId: rubricScore.id },
    });
  } else {
    const parsed = Number(grading);

    if (!Number.isFinite(parsed)) {
      return { success: false, error: "Invalid numerical value." };
    }

    const min =
      rubric.numericalRubric?.min != null
        ? Number(rubric.numericalRubric.min)
        : null;
    const max =
      rubric.numericalRubric?.max != null
        ? Number(rubric.numericalRubric.max)
        : null;

    if (min != null && parsed < min) {
      return { success: false, error: `Score must be at least ${min}.` };
    }
    if (max != null && parsed > max) {
      return { success: false, error: `Score must be at most ${max}.` };
    }

    if (min == null || max == null || max <= min) {
      return { success: false, error: "Numerical rubric bounds are invalid." };
    }

    await prisma.numericalRubricScore.upsert({
      where: { rubricScoreId: rubricScore.id },
      create: { rubricScoreId: rubricScore.id, score: parsed },
      update: { score: parsed },
    });
    await prisma.booleanRubricScore.deleteMany({
      where: { rubricScoreId: rubricScore.id },
    });
    await prisma.ordinalRubricScore.deleteMany({
      where: { rubricScoreId: rubricScore.id },
    });
  }

  updateTag(`assessments:${paperId}:${questionId}`);

  return { success: true };
}
