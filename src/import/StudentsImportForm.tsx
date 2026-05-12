"use client";

import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import React, { type ReactElement } from "react";
import { useFormStatus } from "react-dom";
import { importStudentsAction } from "./importDataAction";
import { initialImportState } from "./importState";

const CSV_PLACEHOLDER = `family_name,first_name,id,team
Smith,Alice,s1001,
Johnson,Bob,s1002,
Williams,Carol,s1003,group-a
Davis,Dan,s1004,group-a`;

type HelpDialogProps = {
  open: boolean;
  onClose: () => void;
};

function HelpDialog({ open, onClose }: HelpDialogProps): ReactElement {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Students Import Format Reference</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              Students CSV
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Required columns: <code>family_name</code>,{" "}
              <code>first_name</code>, <code>id</code>. Optional:{" "}
              <code>team</code> (students sharing a team get grouped into the
              same submission).
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: "action.hover",
                borderRadius: 1,
                p: 2,
                fontSize: "0.8rem",
                overflowX: "auto",
                fontFamily: "monospace",
              }}
            >
              {CSV_PLACEHOLDER}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton(): ReactElement {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="contained" disabled={pending}>
      {pending ? "Importing..." : "Import students"}
    </Button>
  );
}

function useDrop(setValue: (text: string) => void) {
  const [isDragging, setIsDragging] = React.useState(false);

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file == null) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") setValue(text);
    };
    reader.readAsText(file);
  }

  return { isDragging, onDragOver, onDragLeave, onDrop };
}

type StudentsImportFormProps = {
  defaultStudentsCsv?: string;
};

export default function StudentsImportForm({
  defaultStudentsCsv,
}: StudentsImportFormProps): ReactElement {
  const [state, formAction] = React.useActionState(
    importStudentsAction,
    initialImportState,
  );

  const [studentsCsv, setStudentsCsv] = React.useState(
    defaultStudentsCsv ?? "",
  );
  const [helpOpen, setHelpOpen] = React.useState(false);

  const csvDrop = useDrop(setStudentsCsv);

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", mb: 1 }}
          >
            <Typography variant="h3" component="h1">
              Import Students
            </Typography>
            <Tooltip title="Show format reference">
              <IconButton
                size="small"
                onClick={() => setHelpOpen(true)}
                aria-label="Show import format help"
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
            Load student or team data into the database.
          </Typography>
          <Link component={NextLink} href="/" underline="hover">
            Back to home
          </Link>
        </Box>

        <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

        {state.status === "success" && state.message ? (
          <Alert severity="success">{state.message}</Alert>
        ) : null}

        {state.status === "error" && state.errors != null ? (
          <Alert severity="error">{state.errors.join(" | ")}</Alert>
        ) : null}

        <Box component="form" action={formAction}>
          <Stack spacing={3}>
            <Box
              onDragOver={csvDrop.onDragOver}
              onDragLeave={csvDrop.onDragLeave}
              onDrop={csvDrop.onDrop}
              sx={{
                borderRadius: 1,
                outline: csvDrop.isDragging ? "2px dashed" : "none",
                outlineColor: "primary.main",
              }}
            >
              <TextField
                label="Students CSV"
                name="studentsCsv"
                value={studentsCsv}
                onChange={(e) => setStudentsCsv(e.target.value)}
                multiline
                minRows={12}
                fullWidth
                required
                spellCheck={false}
                placeholder={CSV_PLACEHOLDER}
                helperText="Drop a .csv file here to fill this field"
              />
            </Box>

            <SubmitButton />
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
