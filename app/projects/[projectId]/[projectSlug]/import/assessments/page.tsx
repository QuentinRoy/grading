import { Suspense } from "react";
import { loadProjectByPublicId } from "@/db/projects";
import AssessmentsImportForm from "@/import/AssessmentsImportForm";
import { assessmentsImportAction } from "@/import/assessmentsImportAction";
import { canonicalProjectRedirect } from "@/projects/canonicalProjectRedirect";

type ProjectImportAssessmentsPageProps = {
	params: Promise<{ projectId: string; projectSlug: string }>;
};

export default async function ProjectImportAssessmentsPage({
	params,
}: ProjectImportAssessmentsPageProps) {
	const { projectId, projectSlug } = await params;
	const project = await loadProjectByPublicId(projectId, { required: true });

	canonicalProjectRedirect({
		project,
		requestedSlug: projectSlug,
		route: { kind: "importAssessments" },
	});

	return (
		<Suspense>
			<AssessmentsImportForm
				action={assessmentsImportAction.bind(null, project.id)}
			/>
		</Suspense>
	);
}
