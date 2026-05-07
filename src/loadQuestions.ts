import { RubricKind, type Prisma } from "@prisma/client";

import { prisma } from "./prisma";

export type Rubric =
  | {
      label: string;
      marks: number;
      type: "boolean";
    }
  | {
      label: string;
      marks: number;
      type: "ordinal";
      values: (string | number)[];
    }
  | {
      label: string;
      marks: number;
      type: "numerical";
      min: number;
      max: number;
      step?: number;
    };

export type Question = {
  label?: string;
  rubrics: Rubric[];
  solution?: string;
};

export type Grid = {
  [id: string]: Question;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function toRubric(
  rubric: {
    kind: RubricKind;
    label: string;
    maxMarks: Prisma.Decimal;
    config: Prisma.JsonValue;
  },
): Rubric {
  const marks = toNumber(rubric.maxMarks);

  if (rubric.kind === RubricKind.ORDINAL) {
    const config = isRecord(rubric.config) ? rubric.config : {};
    const values = Array.isArray(config.values)
      ? config.values.filter(
          (value): value is string | number =>
            typeof value === "string" || typeof value === "number",
        )
      : [];
    return {
      label: rubric.label,
      marks,
      type: "ordinal",
      values,
    };
  }

  if (rubric.kind === RubricKind.NUMERICAL) {
    const config = isRecord(rubric.config) ? rubric.config : {};
    const min = typeof config.min === "number" ? config.min : 0;
    const max = typeof config.max === "number" ? config.max : 1;
    const step = typeof config.step === "number" ? config.step : undefined;
    return {
      label: rubric.label,
      marks,
      type: "numerical",
      min,
      max,
      ...(step == null ? {} : { step }),
    };
  }

  return {
    label: rubric.label,
    marks,
    type: "boolean",
  };
}

export default async function loadQuestions(): Promise<Grid> {
  const questions = await prisma.question.findMany({
    include: {
      rubrics: {
        orderBy: {
          position: "asc",
        },
      },
    },
    orderBy: {
      position: "asc",
    },
  });

  const grid: Grid = Object.fromEntries(
    questions.map((question) => [
      question.externalId,
      {
        label: question.label,
        rubrics: question.rubrics.map(toRubric),
      },
    ]),
  );

  return grid;
}
