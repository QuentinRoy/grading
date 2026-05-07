import yaml from "js-yaml";
import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const numericValue = z.coerce.number();

const baseRubricSchema = z.object({
  id: nonEmptyString,
  description: nonEmptyString.optional(),
  label: nonEmptyString.optional(),
  marks: numericValue.nonnegative(),
});

const booleanRubricSchema = baseRubricSchema.extend({
  type: z.undefined().optional(),
});

const ordinalValuesSchema = z
  .record(nonEmptyString, numericValue.nonnegative())
  .refine((values) => Object.keys(values).length >= 2, {
    message: "Ordinal rubric must have at least 2 values",
  });

const ordinalRubricSchema = z.object({
  id: nonEmptyString,
  description: nonEmptyString.optional(),
  label: nonEmptyString.optional(),
  type: z.literal("ordinal"),
  values: ordinalValuesSchema,
});

const numericalRubricSchema = z
  .object({
    id: nonEmptyString,
    description: nonEmptyString.optional(),
    label: nonEmptyString.optional(),
    type: z.literal("numerical"),
    min: numericValue,
    max: numericValue,
  })
  .refine((r) => r.min < r.max, {
    message: "min must be less than max",
  });

const rubricSchema = z
  .union([booleanRubricSchema, ordinalRubricSchema, numericalRubricSchema])
  .transform((rubric) => {
    if (rubric.type === "ordinal") {
      return {
        ...rubric,
        type: "ordinal" as const,
        marks: Math.max(...Object.values(rubric.values)),
      };
    }

    if (rubric.type === "numerical") {
      return {
        ...rubric,
        type: "numerical" as const,
        min: rubric.min,
        max: rubric.max,
      };
    }

    return { ...rubric, type: "boolean" as const };
  });

const questionSchema = z.object({
  id: nonEmptyString,
  label: nonEmptyString.optional(),
  rubrics: z
    .array(rubricSchema)
    .refine(
      (rubrics) => new Set(rubrics.map((r) => r.id)).size === rubrics.length,
      { message: "Rubric ids must be unique within a question" },
    ),
});

const questionsSchema = z.object({
  questions: z
    .array(questionSchema)
    .refine(
      (questions) =>
        new Set(questions.map((q) => q.id)).size === questions.length,
      { message: "Question ids must be unique" },
    ),
});

const studentRowSchema = z.object({
  family_name: nonEmptyString,
  first_name: nonEmptyString,
  id: nonEmptyString,
  team: z.string().trim().default(""),
});

const studentRowsSchema = z.array(studentRowSchema);

export type ImportedRubric = z.output<typeof rubricSchema>;
export type ImportedQuestion = z.output<typeof questionSchema>;
export type ImportedQuestions = z.output<typeof questionsSchema>["questions"];
export type ImportedStudent = {
  familyName: string;
  firstName: string;
  id: string;
  team?: string;
};
export type ImportedPaper = {
  id: string;
  label: string;
  team?: string;
  students: ImportedStudent[];
};

export function toSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function parseQuestionsYaml(content: string): ImportedQuestions {
  const parsed = yaml.load(content);
  return questionsSchema.parse(parsed).questions;
}

export function parseStudentsCsv(content: string): ImportedStudent[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const [headerLine, ...rowLines] = lines;
  const headers = headerLine.split(",");
  const rows = rowLines.map((rowLine) => {
    const values = rowLine.split(",");
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });

  return studentRowsSchema.parse(rows).map((row) => ({
    familyName: row.family_name,
    firstName: row.first_name,
    id: row.id,
    team: row.team.length > 0 ? row.team : undefined,
  }));
}

export function buildPapersFromStudents(
  students: ImportedStudent[],
): ImportedPaper[] {
  const groupedByPaper = new Map<string, ImportedStudent[]>();

  students.forEach((student) => {
    const key =
      student.team == null ? `student:${student.id}` : `team:${student.team}`;
    const currentStudents = groupedByPaper.get(key) ?? [];
    currentStudents.push(student);
    groupedByPaper.set(key, currentStudents);
  });

  const usedIds = new Set<string>();

  return Array.from(groupedByPaper.values()).map((groupedStudents) => {
    const firstStudent = groupedStudents[0];

    if (firstStudent.team != null) {
      let id = `team-${toSlug(firstStudent.team) || "unknown"}`;
      let suffix = 1;
      while (usedIds.has(id)) {
        suffix += 1;
        id = `team-${toSlug(firstStudent.team) || "unknown"}-${suffix}`;
      }
      usedIds.add(id);

      return {
        id,
        label: `Team ${firstStudent.team}`,
        team: firstStudent.team,
        students: groupedStudents,
      };
    }

    let id = `paper-${toSlug(firstStudent.id) || "unknown"}`;
    let suffix = 1;
    while (usedIds.has(id)) {
      suffix += 1;
      id = `paper-${toSlug(firstStudent.id) || "unknown"}-${suffix}`;
    }
    usedIds.add(id);

    return {
      id,
      label: `${firstStudent.familyName} ${firstStudent.firstName}`.trim(),
      students: groupedStudents,
    };
  });
}

export function formatZodIssues(issues: z.ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });
}
