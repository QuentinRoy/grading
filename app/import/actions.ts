"use server";

import { Prisma, RubricType } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { ZodError } from "zod";

import {
  buildPapersFromStudents,
  formatZodIssues,
  parseQuestionsYaml,
  parseStudentsCsv,
} from "../../src/importData";
import { prisma } from "../../src/prisma";

import type { ImportState } from "./types";

export type { ImportState } from "./types";

export async function importDataAction(
  _previousState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const questionsYaml = String(formData.get("questionsYaml") ?? "");
  const studentsCsv = String(formData.get("studentsCsv") ?? "");

  try {
    const questions = parseQuestionsYaml(questionsYaml);
    const students = parseStudentsCsv(studentsCsv);
    const papers = buildPapersFromStudents(students);

    const result = await prisma.$transaction(async (tx) => {
      let questionCount = 0;
      let rubricCount = 0;
      let paperCount = 0;
      let studentCount = 0;

      for (const [questionPosition, question] of questions.entries()) {
        const questionId = question.id;
        const persistedQuestion = await tx.question.upsert({
          where: { id: questionId },
          update: {
            label: question.label ?? null,
            position: questionPosition,
          },
          create: {
            id: questionId,
            label: question.label ?? null,
            position: questionPosition,
          },
        });
        questionCount += 1;

        const importedRubricIds = question.rubrics.map((r) => r.id);

        for (const [position, rubric] of question.rubrics.entries()) {
          const rubricId = rubric.id;
          const persistedRubric = await tx.rubric.upsert({
            where: { id: rubricId },
            update: {
              questionId: persistedQuestion.id,
              position,
              description: rubric.description ?? null,
              label: rubric.label ?? null,
              type:
                rubric.type === "boolean"
                  ? RubricType.BOOLEAN
                  : rubric.type === "ordinal"
                    ? RubricType.ORDINAL
                    : RubricType.NUMERICAL,
            },
            create: {
              id: rubricId,
              questionId: persistedQuestion.id,
              position,
              description: rubric.description ?? null,
              label: rubric.label ?? null,
              type:
                rubric.type === "boolean"
                  ? RubricType.BOOLEAN
                  : rubric.type === "ordinal"
                    ? RubricType.ORDINAL
                    : RubricType.NUMERICAL,
            },
          });

          if (rubric.type === "boolean") {
            await tx.booleanRubric.upsert({
              where: { rubricId: persistedRubric.id },
              update: { marks: new Prisma.Decimal(rubric.marks) },
              create: {
                rubricId: persistedRubric.id,
                marks: new Prisma.Decimal(rubric.marks),
              },
            });
            await tx.ordinalRubric.deleteMany({
              where: { rubricId: persistedRubric.id },
            });
            await tx.numericalRubric.deleteMany({
              where: { rubricId: persistedRubric.id },
            });
          } else if (rubric.type === "ordinal") {
            const persistedOrdinalRubric = await tx.ordinalRubric.upsert({
              where: { rubricId: persistedRubric.id },
              update: {},
              create: {
                rubricId: persistedRubric.id,
              },
            });

            const labels = Object.keys(rubric.values);
            await Promise.all(
              Object.entries(rubric.values).map(([label, score]) =>
                tx.ordinalRubricValue.upsert({
                  where: {
                    ordinalRubricId_label: {
                      ordinalRubricId: persistedOrdinalRubric.id,
                      label,
                    },
                  },
                  update: {
                    score: new Prisma.Decimal(score),
                  },
                  create: {
                    ordinalRubricId: persistedOrdinalRubric.id,
                    label,
                    score: new Prisma.Decimal(score),
                  },
                }),
              ),
            );
            await tx.ordinalRubricValue.deleteMany({
              where: {
                ordinalRubricId: persistedOrdinalRubric.id,
                label: {
                  notIn: labels,
                },
              },
            });
            await tx.booleanRubric.deleteMany({
              where: { rubricId: persistedRubric.id },
            });
            await tx.numericalRubric.deleteMany({
              where: { rubricId: persistedRubric.id },
            });
          } else {
            await tx.numericalRubric.upsert({
              where: { rubricId: persistedRubric.id },
              update: {
                min: new Prisma.Decimal(rubric.min),
                max: new Prisma.Decimal(rubric.max),
              },
              create: {
                rubricId: persistedRubric.id,
                min: new Prisma.Decimal(rubric.min),
                max: new Prisma.Decimal(rubric.max),
              },
            });
            await tx.booleanRubric.deleteMany({
              where: { rubricId: persistedRubric.id },
            });
            await tx.ordinalRubric.deleteMany({
              where: { rubricId: persistedRubric.id },
            });
          }

          rubricCount += 1;
        }

        await tx.rubric.deleteMany({
          where: {
            questionId: persistedQuestion.id,
            id: {
              notIn: importedRubricIds,
            },
          },
        });
      }

      for (const paper of papers) {
        const persistedPaper = await tx.paper.upsert({
          where: { id: paper.id },
          update: {
            label: paper.label,
            team: paper.team,
          },
          create: {
            id: paper.id,
            label: paper.label,
            team: paper.team,
          },
        });
        paperCount += 1;

        for (const student of paper.students) {
          await tx.student.upsert({
            where: { id: student.id },
            update: {
              familyName: student.familyName,
              firstName: student.firstName,
              team: student.team,
              paperId: persistedPaper.id,
            },
            create: {
              id: student.id,
              familyName: student.familyName,
              firstName: student.firstName,
              team: student.team,
              paperId: persistedPaper.id,
            },
          });
          studentCount += 1;
        }
      }

      return { questionCount, rubricCount, paperCount, studentCount };
    });

    revalidateTag("questions", "seconds");
    revalidateTag("papers", "seconds");

    return {
      status: "success",
      message: `Imported ${result.questionCount} questions, ${result.rubricCount} rubrics, ${result.paperCount} papers, and ${result.studentCount} students. Existing records were updated in place.`,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        errors: formatZodIssues(error.issues),
      };
    }

    if (error instanceof Error) {
      return {
        status: "error",
        errors: [error.message],
      };
    }

    return {
      status: "error",
      errors: ["Unknown import error"],
    };
  }
}
