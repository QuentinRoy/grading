"use client";

import { Box, Container, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { type ReactElement, useEffect, useMemo, useState } from "react";
import QuestionTable from "./QuestionTable";
import SelectedQuestionPane from "./SelectedQuestionPane";
import { type QuestionManagementItem } from "./types";

type QuestionsManagementClientProps = {
  questions: QuestionManagementItem[];
};

export default function QuestionsManagementClient({
  questions,
}: QuestionsManagementClientProps): ReactElement {
  const router = useRouter();
  const [selectedQuestionId, setSelectedQuestionId] = useState<
    string | undefined
  >(questions[0]?.id);

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId),
    [questions, selectedQuestionId],
  );

  useEffect(() => {
    if (selectedQuestionId == null && questions.length > 0) {
      setSelectedQuestionId(questions[0]?.id);
    }
  }, [questions, selectedQuestionId]);

  return (
    <Container component="main" maxWidth="xl" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Typography component="h1" variant="h3" sx={{ mb: 1 }}>
            Questions Management
          </Typography>
          <Typography color="text.secondary">
            Inspect, add, edit, and delete questions with rubric definitions.
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
          <Box sx={{ flex: "1 1 0" }}>
            <QuestionTable
              questions={questions}
              selectedQuestionId={selectedQuestionId}
              onSelectQuestion={setSelectedQuestionId}
              onCreate={() => router.push("/questions/new")}
            />
          </Box>

          <Box sx={{ flex: "1 1 0" }}>
            <SelectedQuestionPane
              question={selectedQuestion}
              onDeleteSuccess={() => {
                router.refresh();
                setSelectedQuestionId(undefined);
              }}
            />
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
}
