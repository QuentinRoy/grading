import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import loadPapers from "../../src/papers/loadPapers";
import { loadQuestion } from "../../src/questions/loadQuestions";

type PageParams = {
  questionId: string;
};

type QuestionPageProps = {
  params: Promise<PageParams>;
};

export default function QuestionPage({ params }: QuestionPageProps) {
  return (
    <Suspense>
      <QuestionPageContent params={params} />
    </Suspense>
  );
}

async function QuestionPageContent({ params }: QuestionPageProps) {
  const { questionId } = await params;
  const papers = await loadPapers();
  const question = await loadQuestion(questionId);

  if (question == null) {
    notFound();
  }

  if (papers.length === 0) {
    notFound();
  }

  return redirect(`/${questionId}/${papers[0].id}`);
}
