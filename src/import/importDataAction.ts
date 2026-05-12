"use server";

import { revalidateTag } from "next/cache";
import { prettifyError, ZodError } from "zod";
import {
  buildSubmissionsFromStudents,
  parseQuestionsYaml,
  parseStudentsCsv,
  persistImportData,
  persistQuestionsOnly,
  persistStudentsOnly,
} from "./importData";
import type { ImportState } from "./importState";

export type { ImportState } from "./importState";

export async function importQuestionsAction(
  _previousState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const questionsYaml = String(formData.get("questionsYaml") ?? "");

  try {
    const questions = parseQuestionsYaml(questionsYaml);
    const result = await persistQuestionsOnly(questions);

    revalidateTag("questions", "max");
    revalidateTag("assessments", "max");

    return {
      status: "success",
      message: `Imported ${result.questionCount} questions and ${result.rubricCount} rubrics. Existing records were updated in place.`,
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

export async function importStudentsAction(
  _previousState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const studentsCsv = String(formData.get("studentsCsv") ?? "");

  try {
    const students = parseStudentsCsv(studentsCsv);
    const submissions = buildSubmissionsFromStudents(students);

    const result = await persistStudentsOnly(submissions);

    revalidateTag("submissions", "max");
    revalidateTag("assessments", "max");

    return {
      status: "success",
      message: `Imported ${result.submissionCount} submissions and ${result.studentCount} students. Existing records were updated in place.`,
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
