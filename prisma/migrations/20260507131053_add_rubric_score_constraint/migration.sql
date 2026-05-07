-- Add check constraint to ensure RubricScore.score is between 0 and 1
ALTER TABLE "RubricScore" ADD CONSTRAINT "RubricScore_score_check" CHECK (score >= 0 AND score <= 1);
