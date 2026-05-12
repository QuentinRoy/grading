"use server";

import { revalidateTag } from "next/cache";
import { prettifyError, ZodError } from "zod";
import { persistImportData } from "../db/importData";
import {
  buildPapersFromStudents,
  parseQuestionsYaml,
  parseStudentsCsv,
} from "./importData";
import type { ImportState } from "./importState";

export type { ImportState } from "./importState";

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

    const papersById = papers.map((paper) => ({
      id: paper.id,
      label: paper.label,
      team: paper.team,
    }));

    const studentsWithPaper = papers.flatMap((paper) =>
      paper.students.map((student) => ({
        id: student.id,
        familyName: student.familyName,
        firstName: student.firstName,
        team: student.team,
        paperId: paper.id,
      })),
    );

    const questionsById = questions.map((question, position) => ({
      id: question.id,
      label: question.label ?? null,
      position,
    }));

    const rubricRows = questions.flatMap((question) =>
      question.rubrics.map((rubric, position) => ({
        id: rubric.id,
        questionId: question.id,
        position,
        description: rubric.description ?? null,
        label: rubric.label ?? null,
        type: rubric.type,
      })),
    );

    const booleanRubricRows = questions.flatMap((question) =>
      question.rubrics.flatMap((rubric) =>
        rubric.type === "boolean"
          ? [
              {
                rubricId: rubric.id,
                marks: rubric.marks,
              },
            ]
          : [],
      ),
    );

    const numericalRubricRows = questions.flatMap((question) =>
      question.rubrics.flatMap((rubric) =>
        rubric.type === "numerical"
          ? [
              {
                rubricId: rubric.id,
                minScore: rubric.minScore,
                maxScore: rubric.maxScore,
                minMarks: rubric.minMarks,
                maxMarks: rubric.maxMarks,
              },
            ]
          : [],
      ),
    );

    const ordinalRubricSources = questions.flatMap((question) =>
      question.rubrics.flatMap((rubric) =>
        rubric.type === "ordinal"
          ? [
              {
                rubricId: rubric.id,
                marks: rubric.marks,
              },
            ]
          : [],
      ),
    );

    const ordinalRubricRows = ordinalRubricSources.map(({ rubricId }) => ({
      rubricId,
    }));

    const result = await persistImportData({
      questionsById,
      papersById,
      studentsWithPaper,
      rubricRows,
      booleanRubricRows,
      numericalRubricRows,
      ordinalRubricSources,
      ordinalRubricRows,
    });

    revalidateTag("questions", "seconds");
    revalidateTag("papers", "seconds");
    revalidateTag("assessments", "seconds");

    return {
      status: "success",
      message: `Imported ${result.questionCount} questions, ${result.rubricCount} rubrics, ${result.paperCount} papers, and ${result.studentCount} students. Existing records were updated in place.`,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        errors: [prettifyError(error)],
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
