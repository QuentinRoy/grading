"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import React from "react";
import { useFormStatus } from "react-dom";

import { importDataAction } from "./actions";
import { initialImportState } from "./types";

type ImportPageClientProps = {
  defaultQuestionsYaml?: string;
  defaultStudentsCsv?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="contained" disabled={pending}>
      {pending ? "Importing..." : "Import into database"}
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

export default function ImportPageClient({
  defaultQuestionsYaml,
  defaultStudentsCsv,
}: ImportPageClientProps): React.ReactElement {
  const [state, formAction] = React.useActionState(
    importDataAction,
    initialImportState,
  );

  const [questionsYaml, setQuestionsYaml] = React.useState(
    defaultQuestionsYaml ?? "",
  );
  const [studentsCsv, setStudentsCsv] = React.useState(
    defaultStudentsCsv ?? "",
  );

  const yamlDrop = useDrop(setQuestionsYaml);
  const csvDrop = useDrop(setStudentsCsv);

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Import Data
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Load question rubrics and student or team data into PostgreSQL.
          </Typography>
          <Link component={NextLink} href="/" underline="hover">
            Back to grading home
          </Link>
        </Box>

        <Alert severity="info">
          Boolean rubrics are the default. To declare other types, use `type:
          ordinal` with a `values` list, or `type: numerical` with `min` and
          `max`.
        </Alert>

        {state.status === "success" && state.message ? (
          <Alert severity="success">{state.message}</Alert>
        ) : null}

        {state.status === "error" && state.errors != null ? (
          <Alert severity="error">{state.errors.join(" | ")}</Alert>
        ) : null}

        <Box component="form" action={formAction}>
          <Stack spacing={3}>
            <Box
              onDragOver={yamlDrop.onDragOver}
              onDragLeave={yamlDrop.onDragLeave}
              onDrop={yamlDrop.onDrop}
              sx={{
                borderRadius: 1,
                outline: yamlDrop.isDragging ? "2px dashed" : "none",
                outlineColor: "primary.main",
              }}
            >
              <TextField
                label="Questions YAML"
                name="questionsYaml"
                value={questionsYaml}
                onChange={(e) => setQuestionsYaml(e.target.value)}
                multiline
                minRows={18}
                fullWidth
                required
                spellCheck={false}
                helperText="Drop a .yaml file here to fill this field"
              />
            </Box>

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
