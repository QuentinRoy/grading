import { cacheTag } from "next/cache";
import { prisma } from "./prisma";

export type RubricGrading = string;

// Returns a map from rubricId (DB id) to grading
export async function loadAssessment(
  paperId: string, // externalId
  questionId: string, // externalId
): Promise<Map<string, RubricGrading>> {
  "use cache";
  cacheTag(`assessments:${paperId}:${questionId}`);

  const assessment = await prisma.assessment.findFirst({
    where: {
      paper: { externalId: paperId },
      question: { externalId: questionId },
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
      result.set(
        score.rubricId,
        score.booleanScore.passed ? "passed" : "failed",
      );
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
      result.set(score.rubricId, String(numericScore));
    }
  }

  return result;
}
