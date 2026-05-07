/*
  Warnings:

  - You are about to drop the column `externalId` on the `Paper` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `Student` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Paper_externalId_key";

-- DropIndex
DROP INDEX "Question_externalId_key";

-- DropIndex
DROP INDEX "Student_externalId_key";

-- AlterTable
ALTER TABLE "Paper" DROP COLUMN "externalId";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "externalId",
ALTER COLUMN "label" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Rubric" ADD COLUMN     "description" TEXT,
ALTER COLUMN "label" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "externalId";
