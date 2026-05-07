-- AlterTable: add columns with temporary defaults to handle existing rows
ALTER TABLE "NumericalRubric"
ADD COLUMN "min" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "max" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Migrate existing data: preserve marks as max, default min to 0
UPDATE "NumericalRubric" SET "max" = "marks", "min" = 0;

-- Drop the old column
ALTER TABLE "NumericalRubric" DROP COLUMN "marks";

-- Remove temporary defaults so new rows must provide explicit values
ALTER TABLE "NumericalRubric" ALTER COLUMN "min" DROP DEFAULT;
ALTER TABLE "NumericalRubric" ALTER COLUMN "max" DROP DEFAULT;
