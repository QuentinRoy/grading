import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import SubmissionAssessmentClient from "@/assessment/SubmissionAssessmentClient";
import { loadAssessment } from "@/db/assessments";
import { loadProjectBySlug } from "@/db/projects";
import { loadQuestion } from "@/db/questions";
import { loadSubmissionQuestionProgress } from "@/db/submissionProgress";
import { loadSubmissions } from "@/db/submissions";
import { projectAssessmentsPath } from "@/projects/routes";
import { attachAssessment } from "@/rubrics/rubric";
import CodeSnippet from "@/shared/CodeSnippet";
import MuiNextLink from "@/shared/MuiNextLink";

type PageParams = {
  projectSlug: string;
  submissionId: string;
  questionId: string;
};

type QuestionSubmissionPageProps = {
  params: Promise<PageParams>;
};

export default function ProjectQuestionSubmissionPage({
  params,
}: QuestionSubmissionPageProps) {
  return <ProjectQuestionSubmissionPageContent params={params} />;
}

async function ProjectQuestionSubmissionPageContent({
  params,
}: QuestionSubmissionPageProps) {
  const { projectSlug, submissionId, questionId } = await params;

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <QuestionHeaderSection
        projectSlug={projectSlug}
        questionId={questionId}
      />
      <SubmissionRubricSection
        questionId={questionId}
        submissionId={submissionId}
        projectSlug={projectSlug}
      />
    </Container>
  );
}

async function QuestionHeaderSection({
  projectSlug,
  questionId,
}: {
  projectSlug: string;
  questionId: string;
}) {
  "use cache";
  cacheTag("questions", `questions:${questionId}`);
  const [project, question] = await Promise.all([
    loadProjectBySlug(projectSlug),
    loadQuestion(questionId),
  ]);

  if (project == null || question == null) {
    notFound();
  }

  return (
    <>
      <Box component="header" sx={{ pb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MuiNextLink
            color="inherit"
            href={projectAssessmentsPath(projectSlug)}
          >
            Assessments
          </MuiNextLink>
          <Typography color="textPrimary">
            {question.label ?? questionId}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box component="section">
        <Typography component="h1" variant="h4" gutterBottom>
          {question.label ?? questionId}
        </Typography>

        {question.solution && (
          <Box sx={{ mb: 2 }}>
            <CodeSnippet>{question.solution}</CodeSnippet>
          </Box>
        )}
      </Box>
    </>
  );
}

async function SubmissionRubricSection({
  questionId,
  submissionId,
  projectSlug,
}: {
  questionId: string;
  submissionId: string;
  projectSlug: string;
}) {
  "use cache";
  cacheTag(`assessments:${submissionId}:${questionId}`);
  cacheTag(`assessments:question:${questionId}`);
  cacheTag(`questions:${questionId}`);
  cacheTag("submissions");

  const [project, question, submissions, assessments, progressBySubmissionId] =
    await Promise.all([
      loadProjectBySlug(projectSlug),
      loadQuestion(questionId),
      loadSubmissions(),
      loadAssessment(submissionId, questionId),
      loadSubmissionQuestionProgress(questionId),
    ]);
  const hasSubmission = submissions.some(
    (submission) => submission.id === submissionId,
  );

  if (project == null || question == null || !hasSubmission) {
    notFound();
  }

  const rubricsWithAssessments = question.rubrics.map((rubric) =>
    attachAssessment(rubric, assessments),
  );

  return (
    <SubmissionAssessmentClient
      key={`${questionId}-${submissionId}`}
      questionId={questionId}
      questionLabel={question.label}
      rubrics={rubricsWithAssessments}
      submissions={submissions}
      progressBySubmissionId={progressBySubmissionId}
      currentSubmissionId={submissionId}
    />
  );
}
