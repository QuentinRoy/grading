import { Prisma, RubricType } from "@prisma/client";
import { prisma } from "./prisma";

type ImportQuestionRow = {
  id: string;
  label: string | null;
  position: number;
};

type ImportPaperRow = {
  id: string;
  label: string;
  team?: string;
};

type ImportStudentRow = {
  id: string;
  familyName: string;
  firstName: string;
  team?: string;
  paperId: string;
};

type ImportRubricRow = {
  id: string;
  questionId: string;
  position: number;
  description: string | null;
  label: string | null;
  type: string;
};

type ImportBooleanRubricRow = {
  rubricId: string;
  marks: number;
};

type ImportNumericalRubricRow = {
  rubricId: string;
  minScore: number;
  maxScore: number;
  minMarks: number;
  maxMarks: number;
};

type ImportOrdinalRubricSource = {
  rubricId: string;
  marks: Record<string, number>;
};

type ImportOrdinalRubricRow = {
  rubricId: string;
};

function toRubricType(type: string): RubricType {
  if (type === "boolean") return RubricType.BOOLEAN;
  if (type === "ordinal") return RubricType.ORDINAL;
  return RubricType.NUMERICAL;
}

type PersistImportDataArgs = {
  questionsById: ImportQuestionRow[];
  papersById: ImportPaperRow[];
  studentsWithPaper: ImportStudentRow[];
  rubricRows: ImportRubricRow[];
  booleanRubricRows: ImportBooleanRubricRow[];
  numericalRubricRows: ImportNumericalRubricRow[];
  ordinalRubricSources: ImportOrdinalRubricSource[];
  ordinalRubricRows: ImportOrdinalRubricRow[];
};

export async function persistImportData({
  questionsById,
  papersById,
  studentsWithPaper,
  rubricRows,
  booleanRubricRows,
  numericalRubricRows,
  ordinalRubricSources,
  ordinalRubricRows,
}: PersistImportDataArgs): Promise<{
  questionCount: number;
  rubricCount: number;
  paperCount: number;
  studentCount: number;
}> {
  const questionIds = questionsById.map((question) => question.id);
  const rubricIds = rubricRows.map((rubric) => rubric.id);
  const ordinalRubricIds = ordinalRubricRows.map((rubric) => rubric.rubricId);
  const rubricTypeById = new Map(
    rubricRows.map((rubric) => [rubric.id, toRubricType(rubric.type)]),
  );

  return prisma.$transaction(async (tx) => {
    const existingRubrics = await tx.rubric.findMany({
      where: { id: { in: rubricIds } },
      select: {
        id: true,
        type: true,
      },
    });

    const rubricsToRecreate = existingRubrics.flatMap((rubric) => {
      const nextType = rubricTypeById.get(rubric.id);

      if (nextType == null || nextType === rubric.type) {
        return [];
      }

      return [rubric.id];
    });

    if (rubricsToRecreate.length > 0) {
      await tx.rubric.deleteMany({
        where: { id: { in: rubricsToRecreate } },
      });
    }

    await Promise.all([
      ...questionsById.map((question) =>
        tx.question.upsert({
          where: { id: question.id },
          create: question,
          update: {
            label: question.label,
            position: question.position,
          },
        }),
      ),
      ...papersById.map((paper) =>
        tx.paper.upsert({
          where: { id: paper.id },
          create: paper,
          update: {
            label: paper.label,
            team: paper.team,
          },
        }),
      ),
    ]);

    await Promise.all(
      studentsWithPaper.map((student) =>
        tx.student.upsert({
          where: { id: student.id },
          create: student,
          update: {
            familyName: student.familyName,
            firstName: student.firstName,
            team: student.team,
            paperId: student.paperId,
          },
        }),
      ),
    );

    await Promise.all(
      rubricRows.map((rubric) =>
        tx.rubric.upsert({
          where: { id: rubric.id },
          create: {
            id: rubric.id,
            questionId: rubric.questionId,
            position: rubric.position,
            description: rubric.description,
            label: rubric.label,
            type: toRubricType(rubric.type),
          },
          update: {
            questionId: rubric.questionId,
            position: rubric.position,
            description: rubric.description,
            label: rubric.label,
            type: toRubricType(rubric.type),
          },
        }),
      ),
    );

    await Promise.all([
      ...booleanRubricRows.map((booleanRubric) =>
        tx.booleanRubric.upsert({
          where: { rubricId: booleanRubric.rubricId },
          create: {
            rubricId: booleanRubric.rubricId,
            marks: new Prisma.Decimal(booleanRubric.marks),
          },
          update: {
            marks: new Prisma.Decimal(booleanRubric.marks),
          },
        }),
      ),
      ...ordinalRubricRows.map((ordinalRubric) =>
        tx.ordinalRubric.upsert({
          where: { rubricId: ordinalRubric.rubricId },
          create: {
            rubricId: ordinalRubric.rubricId,
          },
          update: {},
        }),
      ),
      ...numericalRubricRows.map((numericalRubric) =>
        tx.numericalRubric.upsert({
          where: { rubricId: numericalRubric.rubricId },
          create: {
            rubricId: numericalRubric.rubricId,
            minScore: new Prisma.Decimal(numericalRubric.minScore),
            maxScore: new Prisma.Decimal(numericalRubric.maxScore),
            minMarks: new Prisma.Decimal(numericalRubric.minMarks),
            maxMarks: new Prisma.Decimal(numericalRubric.maxMarks),
          },
          update: {
            minScore: new Prisma.Decimal(numericalRubric.minScore),
            maxScore: new Prisma.Decimal(numericalRubric.maxScore),
            minMarks: new Prisma.Decimal(numericalRubric.minMarks),
            maxMarks: new Prisma.Decimal(numericalRubric.maxMarks),
          },
        }),
      ),
    ]);

    await tx.rubric.deleteMany({
      where: {
        questionId: { in: questionIds },
        id: { notIn: rubricIds },
      },
    });

    if (ordinalRubricSources.length > 0) {
      const persistedOrdinalRubrics = await tx.ordinalRubric.findMany({
        where: {
          rubricId: { in: ordinalRubricIds },
        },
        select: {
          id: true,
          rubricId: true,
        },
      });

      const ordinalRubricIdByRubricId = new Map(
        persistedOrdinalRubrics.map((rubric) => [rubric.rubricId, rubric.id]),
      );

      const ordinalValueRows = ordinalRubricSources.flatMap((rubric) => {
        const ordinalRubricId = ordinalRubricIdByRubricId.get(rubric.rubricId);

        if (ordinalRubricId == null) {
          return [];
        }

        return Object.entries(rubric.marks).map(([label, marks]) => ({
          ordinalRubricId,
          label,
          marks: new Prisma.Decimal(marks),
        }));
      });

      await tx.ordinalRubricValue.deleteMany({
        where: {
          ordinalRubricId: {
            in: persistedOrdinalRubrics.map((rubric) => rubric.id),
          },
        },
      });

      if (ordinalValueRows.length > 0) {
        await tx.ordinalRubricValue.createMany({
          data: ordinalValueRows,
        });
      }
    }

    return {
      questionCount: questionsById.length,
      rubricCount: rubricRows.length,
      paperCount: papersById.length,
      studentCount: studentsWithPaper.length,
    };
  });
}
