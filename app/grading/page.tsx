import { Button, Container, Typography } from "@mui/material";
import { Suspense } from "react";
import loadQuestions from "../../src/questions/loadQuestions";
import QuestionList from "../../src/questions/QuestionList";

export default function GradingPage() {
  return (
    <Suspense>
      <GradingPageContent />
    </Suspense>
  );
}

async function GradingPageContent() {
  const grid = await loadQuestions();

  const questions = Object.entries(grid).map(([id, { label }]) => ({
    id,
    label: label == null ? id : label,
  }));

  return (
    <Container component="main" maxWidth="md" sx={{ py: 5 }}>
      <Typography component="h1" variant="h3">
        Grading
      </Typography>
      <Button href="/" sx={{ my: 2 }} variant="text">
        Back to overview
      </Button>
      <QuestionList questions={questions} />
    </Container>
  );
}
