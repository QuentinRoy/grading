import { Suspense } from "react";
import { loadProjectByPublicId } from "@/db/projects";
import StudentsImportForm from "@/import/StudentsImportForm";
import { studentsImportAction } from "@/import/studentsImportAction";
import { canonicalProjectRedirect } from "@/projects/canonicalProjectRedirect";

type ProjectImportStudentsPageProps = {
	params: Promise<{ projectId: string; projectSlug: string }>;
};

export default async function ProjectImportStudentsPage({
	params,
}: ProjectImportStudentsPageProps) {
	const { projectId, projectSlug } = await params;
	const project = await loadProjectByPublicId(projectId, { required: true });

	canonicalProjectRedirect({
		project,
		requestedSlug: projectSlug,
		route: { kind: "importStudents" },
	});

	return (
		<Suspense>
			<StudentsImportForm
				action={studentsImportAction.bind(null, project.id)}
			/>
		</Suspense>
	);
}
