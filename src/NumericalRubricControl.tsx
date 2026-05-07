"use client";

import TextField from "@mui/material/TextField";
import { type ReactElement, useEffect, useState } from "react";

type NumericalRubricControlProps = {
  grading?: number;
  min: number;
  max: number;
  disabled: boolean;
  onGrade: (grading: number) => void;
};

export default function NumericalRubricControl({
  grading,
  min,
  max,
  disabled,
  onGrade,
}: NumericalRubricControlProps): ReactElement {
  const [draft, setDraft] = useState(grading != null ? String(grading) : "");

  useEffect(() => {
    setDraft(grading != null ? String(grading) : "");
  }, [grading]);

  function submit() {
    const trimmed = draft.trim();
    if (trimmed.length === 0) {
      return;
    }
    let parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed === grading) {
      return;
    }
    if (parsed < min) parsed = min;
    else if (parsed > max) parsed = max;
    onGrade(parsed);
  }

  return (
    <TextField
      size="small"
      type="number"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={submit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submit();
        }
      }}
      placeholder="Score"
      disabled={disabled}
      slotProps={{ htmlInput: { min, max, step: "any" } }}
      sx={{ width: 96 }}
    />
  );
}
