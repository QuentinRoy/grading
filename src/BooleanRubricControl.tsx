"use client";

import CheckIcon from "@mui/icons-material/Check";
import CrossIcon from "@mui/icons-material/Clear";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { ReactElement } from "react";

type BooleanRubricControlProps = {
  grading?: boolean;
  disabled: boolean;
  onGrade: (grading: boolean) => void;
};

export default function BooleanRubricControl({
  grading,
  disabled,
  onGrade,
}: BooleanRubricControlProps): ReactElement {
  const buttonValue = grading != null ? (grading ? "passed" : "failed") : null;

  return (
    <ToggleButtonGroup
      value={buttonValue}
      exclusive
      onChange={(_, value: string | null) => {
        if (value != null) {
          onGrade(value === "passed");
        }
      }}
      aria-label="Boolean rubric grading"
      disabled={disabled}
    >
      <ToggleButton
        size="small"
        value="passed"
        aria-label="passed"
        color="primary"
      >
        <CheckIcon color={grading === true ? "primary" : "inherit"} />
      </ToggleButton>
      <ToggleButton
        size="small"
        value="failed"
        color="error"
        aria-label="failed"
      >
        <CrossIcon color={grading === false ? "error" : "inherit"} />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
