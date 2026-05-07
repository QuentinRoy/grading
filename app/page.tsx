import { Container, Typography } from "@mui/material";
import loadQuestions from "../src/loadQuestions";
import QuestionList from "../src/QuestionList";

export default async function HomePage() {
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
      <QuestionList questions={questions} />
    </Container>
  );
}
