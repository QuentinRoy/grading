import { Button, Container, Typography } from "@mui/material";
import { Suspense } from "react";
import loadQuestions from "../src/loadQuestions";
import QuestionList from "../src/QuestionList";

export default function HomePage() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  );
}

async function HomePageContent() {
  const grid = await loadQuestions();

  const questions = Object.entries(grid).map(([id, { label }]) => ({
    id,
    label: label == null ? id : label,
  }));

  return (
    <Container component="main" maxWidth="md" sx={{ py: 5 }}>
      <Typography component="h1" variant="h2">
        Grading Grid
      </Typography>
      <Button href="/import" sx={{ my: 2 }} variant="outlined">
        Import rubric and student data
      </Button>
      <QuestionList questions={questions} />
    </Container>
  );
}
