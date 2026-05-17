import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadProjectBySlug } from "@/db/projects";
import StudentsImportForm from "@/import/StudentsImportForm";

type ProjectImportStudentsPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function ProjectImportStudentsPage({
  params,
}: ProjectImportStudentsPageProps) {
  const { projectSlug } = await params;
  const project = await loadProjectBySlug(projectSlug);

  if (project == null) {
    notFound();
  }

  return (
    <Suspense>
      <StudentsImportForm />
    </Suspense>
  );
}
