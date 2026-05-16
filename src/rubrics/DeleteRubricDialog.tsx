"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type ReactElement, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  buildDeleteConfirmationPhrase,
  matchesDeleteConfirmation,
} from "@/shared/useDeleteConfirmation";

export type DeleteRubricDialogProps = {
  open: boolean;
  rubric?: { id: string; assessmentCount: number };
  action: (formData: FormData) => void;
  actionState: {
    status: string;
    formErrors?: string[];
    fieldErrors?: { confirmationText?: string };
    message?: string;
  };
  onClose: () => void;
};

function DeleteButton({ disabled }: { disabled: boolean }): ReactElement {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      color="error"
      variant="contained"
      disabled={disabled || pending}
    >
      {pending ? "Deleting..." : "Delete rubric"}
    </Button>
  );
}

export default function DeleteRubricDialog({
  open,
  rubric,
  action,
  actionState,
  onClose,
}: DeleteRubricDialogProps): ReactElement {
  const [confirmationText, setConfirmationText] = useState("");

  const expectedPhrase = useMemo(() => {
    if (rubric == null) return "";
    return buildDeleteConfirmationPhrase(
      "rubric",
      rubric.id,
      rubric.assessmentCount,
    );
  }, [rubric]);

  const isMatch = matchesDeleteConfirmation(confirmationText, expectedPhrase);
  const confirmationError = actionState.fieldErrors?.confirmationText;

  const payload = JSON.stringify({
    rubricId: rubric?.id,
    confirmationText,
    expectedPhrase,
  });

  const handleClose = () => {
    setConfirmationText("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Delete Rubric</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {rubric == null ? null : (
            <>
              {rubric.assessmentCount > 0 ? (
                <Typography>
                  This will delete rubric <strong>{rubric.id}</strong> and{" "}
                  <strong>{rubric.assessmentCount}</strong> corresponding
                  assessments.
                </Typography>
              ) : (
                <Typography>
                  This will delete rubric <strong>{rubric.id}</strong>. There is
                  no corresponding assessments.
                </Typography>
              )}
              <Typography color="text.secondary">
                Type this phrase to confirm:
              </Typography>
              <Typography sx={{ fontFamily: "monospace" }}>
                {expectedPhrase}
              </Typography>
            </>
          )}

          {actionState.status === "error" && actionState.formErrors?.length ? (
            <Alert severity="error">{actionState.formErrors.join(" | ")}</Alert>
          ) : null}

          {actionState.status === "success" && actionState.message ? (
            <Alert severity="success">{actionState.message}</Alert>
          ) : null}

          <form action={action}>
            <Stack spacing={2}>
              <TextField
                label="Confirmation"
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                error={confirmationError != null}
                helperText={confirmationError ?? ""}
              />
              <input name="payload" type="hidden" value={payload} />
              <DialogActions sx={{ px: 0 }}>
                <Button variant="outlined" onClick={handleClose}>
                  Cancel
                </Button>
                <DeleteButton disabled={rubric == null || !isMatch} />
              </DialogActions>
            </Stack>
          </form>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
