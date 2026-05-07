"use server";

import { Prisma, RubricKind } from "@prisma/client";
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

function rubricKindFromType(type: "boolean" | "ordinal" | "numerical") {
  switch (type) {
    case "ordinal":
      return RubricKind.ORDINAL;
    case "numerical":
      return RubricKind.NUMERICAL;
    default:
      return RubricKind.BOOLEAN;
  }
}

function rubricConfigFromType(
  rubric:
    | { type: "boolean" }
    | { type: "ordinal"; values: (string | number)[] }
    | { type: "numerical"; min: number; max: number; step?: number },
) {
  if (rubric.type === "ordinal") {
    return { values: rubric.values };
  }

  if (rubric.type === "numerical") {
    return {
      min: rubric.min,
      max: rubric.max,
      ...(rubric.step == null ? {} : { step: rubric.step }),
    };
  }

  return Prisma.JsonNull;
}

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

      for (const [questionPosition, [questionExternalId, question]] of Object.entries(questions).entries()) {
        const persistedQuestion = await tx.question.upsert({
          where: { externalId: questionExternalId },
          update: {
            label: question.label ?? questionExternalId,
            position: questionPosition,
          },
          create: {
            externalId: questionExternalId,
            label: question.label ?? questionExternalId,
            position: questionPosition,
          },
        });
        questionCount += 1;

        for (const [position, rubric] of question.rubrics.entries()) {
          await tx.rubric.upsert({
            where: {
              questionId_position: {
                questionId: persistedQuestion.id,
                position,
              },
            },
            update: {
              label: rubric.label,
              maxMarks: new Prisma.Decimal(rubric.marks),
              kind: rubricKindFromType(rubric.type),
              config: rubricConfigFromType(rubric),
            },
            create: {
              questionId: persistedQuestion.id,
              position,
              label: rubric.label,
              maxMarks: new Prisma.Decimal(rubric.marks),
              kind: rubricKindFromType(rubric.type),
              config: rubricConfigFromType(rubric),
            },
          });
          rubricCount += 1;
        }

        await tx.rubric.deleteMany({
          where: {
            questionId: persistedQuestion.id,
            position: {
              gte: question.rubrics.length,
            },
          },
        });
      }

      for (const paper of papers) {
        const persistedPaper = await tx.paper.upsert({
          where: { externalId: paper.externalId },
          update: {
            label: paper.label,
            team: paper.team,
          },
          create: {
            externalId: paper.externalId,
            label: paper.label,
            team: paper.team,
          },
        });
        paperCount += 1;

        for (const student of paper.students) {
          await tx.student.upsert({
            where: { externalId: student.externalId },
            update: {
              familyName: student.familyName,
              firstName: student.firstName,
              team: student.team,
              paperId: persistedPaper.id,
            },
            create: {
              externalId: student.externalId,
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