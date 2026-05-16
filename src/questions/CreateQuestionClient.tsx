"use client";

import { Container } from "@mui/material";
import { useRouter } from "next/navigation";
import { type ReactElement, useActionState } from "react";
import { editQuestionAction } from "./actions";
import QuestionForm from "./QuestionForm";
import { initialQuestionsActionState } from "./state";
import { createEmptyQuestionEditorValue } from "./types";

export default function CreateQuestionClient(): ReactElement {
  const router = useRouter();
  const [saveState, saveFormAction] = useActionState(
    editQuestionAction,
    initialQuestionsActionState,
  );

  return (
    <Container component="main" maxWidth="md" sx={{ py: 5 }}>
      <QuestionForm
        mode="create"
        initialValue={createEmptyQuestionEditorValue()}
        action={saveFormAction}
        actionState={saveState}
        onCancel={() => router.push("/questions")}
      />
    </Container>
  );
}
