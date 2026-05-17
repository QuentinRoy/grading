import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadProjectBySlug } from "@/db/projects";
import AssessmentsImportForm from "@/import/AssessmentsImportForm";

type ProjectImportAssessmentsPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function ProjectImportAssessmentsPage({
  params,
}: ProjectImportAssessmentsPageProps) {
  const { projectSlug } = await params;
  const project = await loadProjectBySlug(projectSlug);

  if (project == null) {
    notFound();
  }

  return (
    <Suspense>
      <AssessmentsImportForm />
    </Suspense>
  );
}
