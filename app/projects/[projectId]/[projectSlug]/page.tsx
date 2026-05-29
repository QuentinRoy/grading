import { Button, Container, Stack, Typography } from "@mui/material";
import GlobalAssessmentSummary from "@/assessment/GlobalAssessmentSummary";
import { loadGlobalAssessmentProgress } from "@/db/assessmentsProgress";
import { loadProjectByPublicId } from "@/db/projects";
import { canonicalProjectRedirect } from "@/projects/canonicalProjectRedirect";
import { projectAssessmentsPath } from "@/projects/projectPaths";

type ProjectDashboardPageProps = {
	params: Promise<{ projectId: string; projectSlug: string }>;
};

export default async function ProjectDashboardPage({
	params,
}: ProjectDashboardPageProps) {
	const { projectId, projectSlug } = await params;

	const project = await loadProjectByPublicId(projectId, { required: true });

	canonicalProjectRedirect({
		project,
		requestedSlug: projectSlug,
		route: { kind: "dashboard" },
	});

	const progress = await loadGlobalAssessmentProgress(project.id);

	return (
		<Container component="main" maxWidth="md" sx={{ py: 5 }}>
			<Stack sx={{ gap: 3 }}>
				<Typography component="h1" variant="h2">
					{project.name} Dashboard
				</Typography>
				<GlobalAssessmentSummary progress={progress} />
				<div>
					<Button
						href={projectAssessmentsPath(project.id, project.slug)}
						variant="contained"
					>
						Open assessments
					</Button>
				</div>
			</Stack>
		</Container>
	);
}
