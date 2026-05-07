import yaml from "js-yaml";
import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const numericValue = z.coerce.number().finite();
const ordinalValueSchema = z.union([nonEmptyString, numericValue]);

const baseRubricSchema = z.object({
  label: nonEmptyString,
  marks: numericValue.nonnegative(),
});

const booleanRubricSchema = baseRubricSchema.extend({
  type: z.undefined().optional(),
});

const ordinalRubricSchema = baseRubricSchema
  .extend({
    type: z.literal("ordinal"),
    values: z.array(ordinalValueSchema).min(2),
  })
  .refine(
    (rubric) =>
      new Set(rubric.values.map((value) => JSON.stringify(value))).size ===
      rubric.values.length,
    {
      message: "Ordinal rubric values must be unique",
      path: ["values"],
    },
  );

const numericalRubricSchema = baseRubricSchema
  .extend({
    type: z.literal("numerical"),
    min: numericValue.default(0),
    max: numericValue,
    step: numericValue.positive().optional(),
  })
  .refine((rubric) => rubric.max > rubric.min, {
    message: "Numerical rubric max must be greater than min",
    path: ["max"],
  });

const rubricSchema = z
  .union([booleanRubricSchema, ordinalRubricSchema, numericalRubricSchema])
  .transform((rubric) => {
    if (rubric.type === "ordinal") {
      return { ...rubric, type: "ordinal" as const };
    }

    if (rubric.type === "numerical") {
      return { ...rubric, type: "numerical" as const };
    }

    return { ...rubric, type: "boolean" as const };
  });

const questionSchema = z.object({
  label: nonEmptyString.optional(),
  rubrics: z.array(rubricSchema).min(1),
});

const questionsSchema = z.record(nonEmptyString, questionSchema);

const studentRowSchema = z.object({
  family_name: nonEmptyString,
  first_name: nonEmptyString,
  id: nonEmptyString,
  team: z.string().trim().default(""),
});

const studentRowsSchema = z.array(studentRowSchema);

export type ImportedRubric = z.output<typeof rubricSchema>;
export type ImportedQuestion = z.output<typeof questionSchema>;
export type ImportedQuestions = z.output<typeof questionsSchema>;
export type ImportedStudent = {
  familyName: string;
  firstName: string;
  externalId: string;
  team?: string;
};
export type ImportedPaper = {
  externalId: string;
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
  return questionsSchema.parse(parsed);
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
    externalId: row.id,
    team: row.team.length > 0 ? row.team : undefined,
  }));
}

export function buildPapersFromStudents(
  students: ImportedStudent[],
): ImportedPaper[] {
  const groupedByPaper = new Map<string, ImportedStudent[]>();

  students.forEach((student) => {
    const key =
      student.team == null ? `student:${student.externalId}` : `team:${student.team}`;
    const currentStudents = groupedByPaper.get(key) ?? [];
    currentStudents.push(student);
    groupedByPaper.set(key, currentStudents);
  });

  const usedExternalIds = new Set<string>();

  return Array.from(groupedByPaper.values()).map((groupedStudents) => {
    const firstStudent = groupedStudents[0];

    if (firstStudent.team != null) {
      let externalId = `team-${toSlug(firstStudent.team) || "unknown"}`;
      let suffix = 1;
      while (usedExternalIds.has(externalId)) {
        suffix += 1;
        externalId = `team-${toSlug(firstStudent.team) || "unknown"}-${suffix}`;
      }
      usedExternalIds.add(externalId);

      return {
        externalId,
        label: `Team ${firstStudent.team}`,
        team: firstStudent.team,
        students: groupedStudents,
      };
    }

    let externalId = `paper-${toSlug(firstStudent.externalId) || "unknown"}`;
    let suffix = 1;
    while (usedExternalIds.has(externalId)) {
      suffix += 1;
      externalId = `paper-${toSlug(firstStudent.externalId) || "unknown"}-${suffix}`;
    }
    usedExternalIds.add(externalId);

    return {
      externalId,
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
