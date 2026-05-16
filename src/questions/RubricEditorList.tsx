"use client";

import { Button, Stack } from "@mui/material";
import { type ReactElement, useState } from "react";
import DeleteRubricDialog from "@/rubrics/DeleteRubricDialog";
import BooleanRubricEditorPaper from "./BooleanRubricEditorPaper";
import type { QuestionRubricFieldErrors } from "./errors";
import NumericalRubricEditorPaper from "./NumericalRubricEditorPaper";
import OrdinalRubricEditorPaper from "./OrdinalRubricEditorPaper";
import { createRubric } from "./RubricEditorPaper";
import type { RubricEditorValue } from "./types";

type RubricEditorListProps = {
  rubrics: RubricEditorValue[];
  onChange: (rubrics: RubricEditorValue[]) => void;
  fieldErrors?: QuestionRubricFieldErrors[];
};

export default function RubricEditorList({
  rubrics,
  onChange,
  fieldErrors,
}: RubricEditorListProps): ReactElement {
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(
    null,
  );
  const [confirmationError, setConfirmationError] = useState<string | null>(
    null,
  );

  const addRubric = (type: RubricEditorValue["type"]) => {
    onChange([...rubrics, createRubric(type)]);
  };

  const updateRubric = (index: number, rubric: RubricEditorValue) => {
    const next = [...rubrics];
    next[index] = rubric;
    onChange(next);
  };

  const handleRequestRemove = (index: number) => {
    setPendingDeleteIndex(index);
    setConfirmationError(null);
  };

  const handleDialogClose = () => {
    setPendingDeleteIndex(null);
    setConfirmationError(null);
  };

  const handleDialogAction = (formData: FormData) => {
    const confirmationText = formData.get("confirmationText") as string;
    const expectedPhrase = formData.get("expectedPhrase") as string;
    if (!confirmationText || !expectedPhrase) {
      setConfirmationError("Confirmation phrase required.");
      return;
    }
    if (
      confirmationText.trim().toLocaleLowerCase() !==
      expectedPhrase.trim().toLocaleLowerCase()
    ) {
      setConfirmationError("Confirmation phrase does not match.");
      return;
    }
    if (pendingDeleteIndex != null) {
      onChange(rubrics.filter((_, i) => i !== pendingDeleteIndex));
    }
    setPendingDeleteIndex(null);
    setConfirmationError(null);
  };

  return (
    <>
      <Stack spacing={2}>
        <Stack spacing={2}>
          {rubrics.map((rubric, index) => {
            const rubricError = fieldErrors?.[index];
            const key = `${rubric.previousId ?? "new"}-${index}`;
            const onRemove = () => handleRequestRemove(index);

            if (rubric.type === "boolean") {
              return (
                <BooleanRubricEditorPaper
                  key={key}
                  rubric={rubric}
                  onChange={(updated) => updateRubric(index, updated)}
                  onRemove={onRemove}
                  fieldErrors={rubricError}
                />
              );
            }

            if (rubric.type === "ordinal") {
              return (
                <OrdinalRubricEditorPaper
                  key={key}
                  rubric={rubric}
                  onChange={(updated) => updateRubric(index, updated)}
                  onRemove={onRemove}
                  fieldErrors={rubricError}
                />
              );
            }

            return (
              <NumericalRubricEditorPaper
                key={key}
                rubric={rubric}
                onChange={(updated) => updateRubric(index, updated)}
                onRemove={onRemove}
                fieldErrors={rubricError}
              />
            );
          })}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={() => addRubric("boolean")}>
            Add boolean rubric
          </Button>
          <Button variant="outlined" onClick={() => addRubric("ordinal")}>
            Add ordinal rubric
          </Button>
          <Button variant="outlined" onClick={() => addRubric("numerical")}>
            Add numerical rubric
          </Button>
        </Stack>
      </Stack>
      <DeleteRubricDialog
        open={pendingDeleteIndex != null}
        rubric={
          pendingDeleteIndex != null && rubrics[pendingDeleteIndex] != null
            ? { id: rubrics[pendingDeleteIndex].id, assessmentCount: 0 }
            : undefined
        }
        action={handleDialogAction}
        actionState={{
          status: confirmationError ? "error" : "idle",
          formErrors: confirmationError ? [confirmationError] : undefined,
          fieldErrors: {},
        }}
        onClose={handleDialogClose}
      />
    </>
  );
}
