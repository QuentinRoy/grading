"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Fragment, type ReactElement } from "react";
import BooleanRubricControl from "./BooleanRubricControl";
import NumericalRubricControl from "./NumericalRubricControl";
import OrdinalRubricControl from "./OrdinalRubricControl";
import {
  getRubricMaxMarks as computeMarks,
  type Rubric as QuestionRubric,
} from "./rubric";

// Typed rubric items for grading
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

type RubricRowProps<T extends TypedRubricItem = TypedRubricItem> = {
  rubric: T;
  isPending: boolean;
  disabled: boolean;
  onGrade: T extends BooleanRubricItem
    ? (grading: boolean) => void
    : T extends NumericalRubricItem
      ? (grading: number) => void
      : (grading: string) => void;
};

export default function RubricRow<T extends TypedRubricItem = TypedRubricItem>({
  rubric,
  isPending,
  disabled,
  onGrade,
}: RubricRowProps<T>): ReactElement {
  const { label, grading, type } = rubric;
  const rubricMarks = computeMarks(rubric);

  const handleGrade = (value: string | number | boolean) => {
    if (type === "boolean") {
      (onGrade as (g: boolean) => void)(value as boolean);
    } else if (type === "numerical") {
      (onGrade as (g: number) => void)(value as number);
    } else {
      (onGrade as (g: string) => void)(value as string);
    }
  };

  const control =
    type === "ordinal" && "values" in rubric ? (
      <OrdinalRubricControl
        grading={grading}
        values={rubric.values}
        disabled={disabled}
        onGrade={handleGrade}
      />
    ) : type === "numerical" && "min" in rubric ? (
      <NumericalRubricControl
        grading={grading as number | undefined}
        min={rubric.min}
        max={rubric.max}
        disabled={disabled}
        onGrade={handleGrade}
      />
    ) : (
      <BooleanRubricControl
        grading={grading as boolean | undefined}
        disabled={disabled}
        onGrade={handleGrade}
      />
    );

  return (
    <Fragment>
      <Grid size={{ xs: 12, sm: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {control}
          <Box
            sx={{
              width: 16,
              height: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isPending ? <CircularProgress size={12} thickness={6} /> : null}
          </Box>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 8 }}>{label}</Grid>
      <Grid size={{ xs: 12, sm: 1 }}>
        <Typography variant="body2">({rubricMarks})</Typography>
      </Grid>
    </Fragment>
  );
}
