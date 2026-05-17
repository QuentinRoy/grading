import { Button, Container, Stack, Typography } from "@mui/material";
import { notFound } from "next/navigation";
import GlobalAssessmentSummary from "@/assessment/GlobalAssessmentSummary";
import { loadGlobalAssessmentProgress } from "@/db/assessmentsProgress";
import { loadProjectBySlug } from "@/db/projects";
import { projectAssessmentsPath } from "@/projects/routes";

type ProjectDashboardPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function ProjectDashboardPage({
  params,
}: ProjectDashboardPageProps) {
  const { projectSlug } = await params;

  const [project, progress] = await Promise.all([
    loadProjectBySlug(projectSlug),
    loadGlobalAssessmentProgress(),
  ]);

  if (project == null) {
    notFound();
  }

  return (
    <Container component="main" maxWidth="md" sx={{ py: 5 }}>
      <Stack sx={{ gap: 3 }}>
        <Typography component="h1" variant="h2">
          {project.name} Dashboard
        </Typography>
        <GlobalAssessmentSummary progress={progress} />
        <div>
          <Button
            href={projectAssessmentsPath(project.slug)}
            variant="contained"
          >
            Open assessments
          </Button>
        </div>
      </Stack>
    </Container>
  );
}
