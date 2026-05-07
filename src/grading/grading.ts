import type { Rubric } from "../rubrics/rubric";

export type Grading = boolean | number | string;

export type BooleanGradedRubric = Extract<Rubric, { type: "boolean" }> & {
  grading?: boolean;
};

export type OrdinalGradedRubric = Extract<Rubric, { type: "ordinal" }> & {
  grading?: string;
};

export type NumericalGradedRubric = Extract<Rubric, { type: "numerical" }> & {
  grading?: number;
};

export type GradedRubric =
  | BooleanGradedRubric
  | OrdinalGradedRubric
  | NumericalGradedRubric;

export function attachGrading(
  rubric: Rubric,
  grading: Grading | undefined,
): GradedRubric {
  if (rubric.type === "boolean") {
    return {
      ...rubric,
      grading: typeof grading === "boolean" ? grading : undefined,
    };
  }

  if (rubric.type === "ordinal") {
    return {
      ...rubric,
      grading: typeof grading === "string" ? grading : undefined,
    };
  }

  return {
    ...rubric,
    grading: typeof grading === "number" ? grading : undefined,
  };
}
