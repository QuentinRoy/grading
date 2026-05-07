/*
  Warnings:

  - You are about to drop the column `config` on the `Rubric` table. All the data in the column will be lost.
  - You are about to drop the column `kind` on the `Rubric` table. All the data in the column will be lost.
  - You are about to drop the column `maxMarks` on the `Rubric` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `RubricScore` table. All the data in the column will be lost.
  - Added the required column `type` to the `Rubric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `RubricScore` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RubricType" AS ENUM ('BOOLEAN', 'ORDINAL', 'NUMERICAL');

-- AlterTable
ALTER TABLE "Rubric" DROP COLUMN "config",
DROP COLUMN "kind",
DROP COLUMN "maxMarks",
ADD COLUMN     "type" "RubricType" NOT NULL;

-- AlterTable
ALTER TABLE "RubricScore" DROP COLUMN "score",
ADD COLUMN     "type" "RubricType" NOT NULL;

-- DropEnum
DROP TYPE "RubricKind";

-- CreateTable
CREATE TABLE "BooleanRubric" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "marks" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "BooleanRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdinalRubric" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,

    CONSTRAINT "OrdinalRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdinalRubricValue" (
    "id" TEXT NOT NULL,
    "ordinalRubricId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrdinalRubricValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumericalRubric" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "marks" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "NumericalRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BooleanRubricScore" (
    "id" TEXT NOT NULL,
    "rubricScoreId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,

    CONSTRAINT "BooleanRubricScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdinalRubricScore" (
    "id" TEXT NOT NULL,
    "rubricScoreId" TEXT NOT NULL,
    "selectedLabel" TEXT NOT NULL,

    CONSTRAINT "OrdinalRubricScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumericalRubricScore" (
    "id" TEXT NOT NULL,
    "rubricScoreId" TEXT NOT NULL,
    "score" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "NumericalRubricScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BooleanRubric_rubricId_key" ON "BooleanRubric"("rubricId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdinalRubric_rubricId_key" ON "OrdinalRubric"("rubricId");

-- CreateIndex
CREATE INDEX "OrdinalRubricValue_ordinalRubricId_idx" ON "OrdinalRubricValue"("ordinalRubricId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdinalRubricValue_ordinalRubricId_label_key" ON "OrdinalRubricValue"("ordinalRubricId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "NumericalRubric_rubricId_key" ON "NumericalRubric"("rubricId");

-- CreateIndex
CREATE UNIQUE INDEX "BooleanRubricScore_rubricScoreId_key" ON "BooleanRubricScore"("rubricScoreId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdinalRubricScore_rubricScoreId_key" ON "OrdinalRubricScore"("rubricScoreId");

-- CreateIndex
CREATE UNIQUE INDEX "NumericalRubricScore_rubricScoreId_key" ON "NumericalRubricScore"("rubricScoreId");

-- AddForeignKey
ALTER TABLE "BooleanRubric" ADD CONSTRAINT "BooleanRubric_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdinalRubric" ADD CONSTRAINT "OrdinalRubric_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdinalRubricValue" ADD CONSTRAINT "OrdinalRubricValue_ordinalRubricId_fkey" FOREIGN KEY ("ordinalRubricId") REFERENCES "OrdinalRubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumericalRubric" ADD CONSTRAINT "NumericalRubric_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BooleanRubricScore" ADD CONSTRAINT "BooleanRubricScore_rubricScoreId_fkey" FOREIGN KEY ("rubricScoreId") REFERENCES "RubricScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdinalRubricScore" ADD CONSTRAINT "OrdinalRubricScore_rubricScoreId_fkey" FOREIGN KEY ("rubricScoreId") REFERENCES "RubricScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumericalRubricScore" ADD CONSTRAINT "NumericalRubricScore_rubricScoreId_fkey" FOREIGN KEY ("rubricScoreId") REFERENCES "RubricScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
