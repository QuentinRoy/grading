"use client";

import { List, ListItemButton, ListItemText } from "@mui/material";
import Link from "next/link";

type Question = {
  id: string;
  label: string;
};

export default function QuestionList({ questions }: { questions: Question[] }) {
  return (
    <List component="nav" aria-label="Question list">
      {questions.map((question) => (
        <ListItemButton
          key={question.id}
          component={Link}
          href={`/${question.id}`}
        >
          <ListItemText primary={question.label} />
        </ListItemButton>
      ))}
    </List>
  );
}
