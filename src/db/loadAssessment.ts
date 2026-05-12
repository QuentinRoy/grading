import { cacheTag } from "next/cache";
import type { RubricGrading } from "./assessmentTypes";
import { prisma } from "./prisma";

// Returns a map from rubricId (external id) to grading.
export async function loadAssessment(
  paperId: string,
  questionId: string,
): Promise<Map<string, RubricGrading>> {
  "use cache";
  cacheTag(`assessments:${paperId}:${questionId}`);

  const assessment = await prisma.assessment.findFirst({
    where: {
      paper: { id: paperId },
      question: { id: questionId },
    },
    include: {
      scores: {
        select: {
          rubricId: true,
          type: true,
          booleanScore: {
            select: {
              passed: true,
            },
          },
          ordinalScore: {
            select: {
              selectedLabel: true,
            },
          },
          numericalScore: {
            select: {
              score: true,
            },
          },
        },
      },
    },
  });

  const result = new Map<string, RubricGrading>();
  if (assessment == null) return result;

  for (const score of assessment.scores) {
    if (score.booleanScore != null) {
      result.set(score.rubricId, score.booleanScore.passed);
      continue;
    }

    if (score.ordinalScore != null) {
      result.set(score.rubricId, score.ordinalScore.selectedLabel);
      continue;
    }

    if (score.numericalScore != null) {
      const numericScore =
        typeof score.numericalScore.score === "number"
          ? score.numericalScore.score
          : parseFloat(String(score.numericalScore.score));
      result.set(score.rubricId, numericScore);
    }
  }

  return result;
}
