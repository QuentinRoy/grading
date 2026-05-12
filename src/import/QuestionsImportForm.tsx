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
import { importQuestionsAction } from "./importDataAction";
import { initialImportState } from "./importState";

const YAML_PLACEHOLDER = `questions:
  - id: question_1
    label: "Question 1"
    rubrics:
      - id: correct_answer
        type: boolean
        description: "The answer is correct"
        label: "Correct answer"
        marks: 2
      - id: showed_work
        type: boolean
        marks: 1

  - id: question_2
    rubrics:
      - id: performance
        type: ordinal
        description: "Overall performance"
        marks:
          bad: 0
          medium: 2
          good: 4
      - id: numerical_score
        type: numerical
        minMarks: 0
        maxMarks: 6`;

type HelpDialogProps = {
  open: boolean;
  onClose: () => void;
};

function HelpDialog({ open, onClose }: HelpDialogProps): ReactElement {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Questions Import Format Reference</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              Questions YAML
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              A top-level <code>questions</code> array of question objects. Each
              question requires a stable <code>id</code>, has an optional{" "}
              <code>label</code>, and a <code>rubrics</code> array. Each rubric
              requires a stable <code>id</code>, accepts an optional{" "}
              <code>description</code> and <code>label</code>. Boolean rubrics
              use <code>marks</code>, ordinal rubrics use <code>marks</code>,
              and numerical rubrics use <code>minScore</code>/
              <code>maxScore</code> and/or <code>minMarks</code>/
              <code>maxMarks</code>.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Numerical defaults and rules: <code>minScore</code> defaults to{" "}
              <code>0</code>, <code>maxScore</code> defaults to <code>1</code>.
              If <code>minScore</code> is provided, <code>maxScore</code> must
              be provided too. <code>minMarks</code> defaults to <code>0</code>{" "}
              when omitted; <code>maxMarks</code> defaults to <code>0</code>{" "}
              when omitted. At least one of <code>minMarks</code>/
              <code>maxMarks</code> must be provided.
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
              {YAML_PLACEHOLDER}
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
      {pending ? "Importing..." : "Import questions"}
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

type QuestionsImportFormProps = {
  defaultQuestionsYaml?: string;
};

export default function QuestionsImportForm({
  defaultQuestionsYaml,
}: QuestionsImportFormProps): ReactElement {
  const [state, formAction] = React.useActionState(
    importQuestionsAction,
    initialImportState,
  );

  const [questionsYaml, setQuestionsYaml] = React.useState(
    defaultQuestionsYaml ?? "",
  );
  const [helpOpen, setHelpOpen] = React.useState(false);

  const yamlDrop = useDrop(setQuestionsYaml);

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
              Import Questions
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
            Load question rubrics into the database.
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
                placeholder={YAML_PLACEHOLDER}
                helperText="Drop a .yaml file here to fill this field"
              />
            </Box>

            <SubmitButton />
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
