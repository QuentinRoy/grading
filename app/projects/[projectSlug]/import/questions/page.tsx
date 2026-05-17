import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadProjectBySlug } from "@/db/projects";
import QuestionsImportForm from "@/import/QuestionsImportForm";

type ProjectImportQuestionsPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function ProjectImportQuestionsPage({
  params,
}: ProjectImportQuestionsPageProps) {
  const { projectSlug } = await params;
  const project = await loadProjectBySlug(projectSlug);

  if (project == null) {
    notFound();
  }

  return (
    <Suspense>
      <QuestionsImportForm />
    </Suspense>
  );
}
