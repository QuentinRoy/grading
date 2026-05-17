import { notFound } from "next/navigation";
import { loadProjectBySlug } from "@/db/projects";
import { loadManagedQuestions } from "@/db/questions";
import QuestionsManagementClient from "@/questions/QuestionsManagementClient";

type ProjectQuestionsPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function ProjectQuestionsPage({
  params,
}: ProjectQuestionsPageProps) {
  const { projectSlug } = await params;
  const [project, questions] = await Promise.all([
    loadProjectBySlug(projectSlug),
    loadManagedQuestions(),
  ]);

  if (project == null) {
    notFound();
  }

  return (
    <QuestionsManagementClient
      questions={questions.map((question) => ({
        id: question.id,
        label: question.label,
        position: question.position,
        assessmentCount: question.assessmentCount,
        rubricCount: question.rubricCount,
        question: question.question,
      }))}
    />
  );
}
