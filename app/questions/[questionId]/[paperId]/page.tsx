import { redirect } from "next/navigation";

type PageParams = {
  questionId: string;
  paperId: string;
};

type LegacyQuestionPaperPageProps = {
  params: Promise<PageParams>;
};

export default async function LegacyQuestionPaperPage({
  params,
}: LegacyQuestionPaperPageProps) {
  const { questionId, paperId } = await params;
  return redirect(`/grading/papers/${paperId}/questions/${questionId}`);
}
