ALTER TABLE "RubricScore" RENAME TO "RubricAssessment";
ALTER TABLE "BooleanRubricScore" RENAME TO "BooleanRubricAssessment";
ALTER TABLE "OrdinalRubricScore" RENAME TO "OrdinalRubricAssessment";
ALTER TABLE "NumericalRubricScore" RENAME TO "NumericalRubricAssessment";

ALTER TABLE "BooleanRubricAssessment"
RENAME COLUMN "rubricScoreId" TO "rubricAssessmentId";

ALTER TABLE "OrdinalRubricAssessment"
RENAME COLUMN "rubricScoreId" TO "rubricAssessmentId";

ALTER TABLE "NumericalRubricAssessment"
RENAME COLUMN "rubricScoreId" TO "rubricAssessmentId";

ALTER TABLE "RubricAssessment"
RENAME CONSTRAINT "RubricScore_pkey" TO "RubricAssessment_pkey";

ALTER TABLE "RubricAssessment"
RENAME CONSTRAINT "RubricScore_assessmentId_fkey" TO "RubricAssessment_assessmentId_fkey";

ALTER TABLE "RubricAssessment"
RENAME CONSTRAINT "RubricScore_rubricId_fkey" TO "RubricAssessment_rubricId_fkey";

ALTER INDEX "RubricScore_assessmentId_rubricId_key"
RENAME TO "RubricAssessment_assessmentId_rubricId_key";

ALTER TABLE "BooleanRubricAssessment"
RENAME CONSTRAINT "BooleanRubricScore_pkey" TO "BooleanRubricAssessment_pkey";

ALTER TABLE "BooleanRubricAssessment"
RENAME CONSTRAINT "BooleanRubricScore_rubricScoreId_fkey" TO "BooleanRubricAssessment_rubricAssessmentId_fkey";

ALTER INDEX "BooleanRubricScore_rubricScoreId_key"
RENAME TO "BooleanRubricAssessment_rubricAssessmentId_key";

ALTER TABLE "OrdinalRubricAssessment"
RENAME CONSTRAINT "OrdinalRubricScore_pkey" TO "OrdinalRubricAssessment_pkey";

ALTER TABLE "OrdinalRubricAssessment"
RENAME CONSTRAINT "OrdinalRubricScore_rubricScoreId_fkey" TO "OrdinalRubricAssessment_rubricAssessmentId_fkey";

ALTER INDEX "OrdinalRubricScore_rubricScoreId_key"
RENAME TO "OrdinalRubricAssessment_rubricAssessmentId_key";

ALTER TABLE "NumericalRubricAssessment"
RENAME CONSTRAINT "NumericalRubricScore_pkey" TO "NumericalRubricAssessment_pkey";

ALTER TABLE "NumericalRubricAssessment"
RENAME CONSTRAINT "NumericalRubricScore_rubricScoreId_fkey" TO "NumericalRubricAssessment_rubricAssessmentId_fkey";

ALTER INDEX "NumericalRubricScore_rubricScoreId_key"
RENAME TO "NumericalRubricAssessment_rubricAssessmentId_key";
