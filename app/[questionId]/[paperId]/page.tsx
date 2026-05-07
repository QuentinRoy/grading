import { Suspense } from "react";

import { notFound } from "next/navigation";
import loadPapers from "../../../src/loadPapers";
import type { Question } from "../../../src/loadQuestions";
import loadQuestions from "../../../src/loadQuestions";
import QuestionClientPage from "../../../src/QuestionClientPage";

type PageParams = {
  questionId: string;
  paperId: string;
};

type QuestionPaperPageProps = {
  params: Promise<PageParams>;
};

export default function QuestionPaperPage({ params }: QuestionPaperPageProps) {
  return (
    <Suspense>
      <QuestionPaperPageContent params={params} />
    </Suspense>
  );
}

async function QuestionPaperPageContent({ params }: QuestionPaperPageProps) {
  const { questionId, paperId } = await params;
  const grid = await loadQuestions();
  const papers = await loadPapers();

  const question = grid[questionId] as Question | undefined;
  const hasPaper = papers.some((paper) => paper.id === paperId);

  if (question == null || !hasPaper) {
    notFound();
  }

  return (
    <QuestionClientPage
      questionId={questionId}
      question={question}
      papers={papers}
      currentPaperId={paperId}
    />
  );
}
