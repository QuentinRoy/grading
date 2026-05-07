"use client";

import Grid from "@mui/material/Grid";
import type { ReactElement } from "react";
import RubricRow from "./RubricRow";
import type { Rubric as QuestionRubric } from "./rubric";

// Typed rubric items for grading display
type BooleanRubricItem = Extract<QuestionRubric, { type: "boolean" }> & {
  grading?: boolean;
};
type OrdinalRubricItem = Extract<QuestionRubric, { type: "ordinal" }> & {
  grading?: string;
};
type NumericalRubricItem = Extract<QuestionRubric, { type: "numerical" }> & {
  grading?: number;
};
type TypedRubricItem =
  | BooleanRubricItem
  | OrdinalRubricItem
  | NumericalRubricItem;

type Grading = string | number | boolean;

type RubricItem = QuestionRubric & { grading?: string | number | boolean };

type RubricGradingSectionProps = {
  rubrics: RubricItem[];
  pendingByIndex: Record<number, number>;
  disabled: boolean;
  onGrade: (index: number, grading: string) => void;
};

export default function RubricGradingSection({
  rubrics,
  pendingByIndex,
  disabled,
  onGrade,
}: RubricGradingSectionProps): ReactElement {
  const handleGrade = (index: number, value: Grading) => {
    const stringValue =
      typeof value === "boolean"
        ? value
          ? "passed"
          : "failed"
        : String(value);
    onGrade(index, stringValue);
  };

  const convertToTypedRubric = (rubric: RubricItem): TypedRubricItem => {
    if (rubric.type === "boolean") {
      return {
        ...rubric,
        grading:
          typeof rubric.grading === "boolean"
            ? rubric.grading
            : rubric.grading === "passed",
      } as BooleanRubricItem;
    } else if (rubric.type === "numerical") {
      return {
        ...rubric,
        grading:
          typeof rubric.grading === "number"
            ? rubric.grading
            : rubric.grading
              ? Number(rubric.grading)
              : undefined,
      } as NumericalRubricItem;
    } else {
      return {
        ...rubric,
        grading:
          typeof rubric.grading === "string"
            ? rubric.grading
            : rubric.grading
              ? String(rubric.grading)
              : undefined,
      } as OrdinalRubricItem;
    }
  };

  return (
    <Grid container spacing={2} sx={{ mb: 4, alignItems: "center" }}>
      {rubrics.map((rubric, index) => {
        const isPending = (pendingByIndex[index] ?? 0) > 0;
        const typedRubric = convertToTypedRubric(rubric);

        return (
          <RubricRow
            key={rubric.id}
            rubric={typedRubric}
            isPending={isPending}
            disabled={disabled}
            onGrade={(value) => handleGrade(index, value)}
          />
        );
      })}
    </Grid>
  );
}
