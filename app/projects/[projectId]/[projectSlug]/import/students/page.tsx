import { Suspense } from "react";
import StudentsImportForm from "#import/StudentsImportForm.tsx";
import { studentsImportAction } from "#import/studentsImportAction.ts";
import { canonicalProjectRedirect } from "#projects/canonicalProjectRedirect.ts";
import { loadProjectByPublicId } from "#projects/projects.ts";

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
