import { notFound } from "next/navigation";

import type { Question } from "../../src/loadQuestions";
import loadQuestions from "../../src/loadQuestions";
import QuestionClientPage from "../../src/QuestionClientPage";

type PageParams = {
  questionId: string;
};

type QuestionPageProps = {
  params: Promise<PageParams>;
};

export async function generateStaticParams() {
  const grid = await loadQuestions();
  return Object.keys(grid).map((questionId) => ({ questionId }));
}

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { questionId } = await params;
  const grid = await loadQuestions();
  const question = grid[questionId] as Question | undefined;

  if (question == null) {
    notFound();
  }

  return <QuestionClientPage questionId={questionId} question={question} />;
}
