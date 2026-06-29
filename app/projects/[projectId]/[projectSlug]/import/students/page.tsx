import { Suspense } from "react";
import StudentsImportForm from "#imports/students/StudentsImportForm.tsx";
import { studentsImportAction } from "#imports/students/studentsImportAction.ts";
import { loadProjectByPublicId } from "#projects/projects.ts";

type ProjectImportStudentsPageProps = {
	params: Promise<{ projectId: string; projectSlug: string }>;
};

export default async function ProjectImportStudentsPage({
	params,
}: ProjectImportStudentsPageProps) {
	const { projectId } = await params;
	const project = await loadProjectByPublicId(projectId, { required: true });

	return (
		<Suspense>
			<StudentsImportForm
				action={studentsImportAction.bind(null, project.id)}
			/>
		</Suspense>
	);
}
