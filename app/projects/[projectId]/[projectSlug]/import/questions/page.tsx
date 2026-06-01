import { Suspense } from "react";
import { loadProjectByPublicId } from "#db/projects.ts";
import QuestionsImportForm from "#import/QuestionsImportForm.tsx";
import { questionsImportAction } from "#import/questionsImportAction.ts";
import { canonicalProjectRedirect } from "#projects/canonicalProjectRedirect.ts";

type ProjectImportQuestionsPageProps = {
	params: Promise<{ projectId: string; projectSlug: string }>;
};

export default async function ProjectImportQuestionsPage({
	params,
}: ProjectImportQuestionsPageProps) {
	const { projectId, projectSlug } = await params;
	const project = await loadProjectByPublicId(projectId, { required: true });

	canonicalProjectRedirect({
		project,
		requestedSlug: projectSlug,
		route: { kind: "importQuestions" },
	});

	return (
		<Suspense>
			<QuestionsImportForm
				action={questionsImportAction.bind(null, project.id)}
			/>
		</Suspense>
	);
}
