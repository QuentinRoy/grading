import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import MuiSkeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { attachGrading } from "../../../../../../src/grading/grading";
import { loadAssessment } from "../../../../../../src/grading/loadAssessment";
import PaperGradingClient from "../../../../../../src/grading/PaperGradingClient";
import loadPapers from "../../../../../../src/papers/loadPapers";
import { loadQuestion } from "../../../../../../src/questions/loadQuestions";
import CodeSnippet from "../../../../../../src/shared/CodeSnippet";
import MuiNextLink from "../../../../../../src/shared/MuiNextLink";

type PageParams = {
  paperId: string;
  questionId: string;
};

type QuestionPaperPageProps = {
  params: Promise<PageParams>;
};

export default function QuestionPaperPage({ params }: QuestionPaperPageProps) {
  return (
    <Suspense fallback={<PageFallback />}>
      <QuestionPaperPageContent params={params} />
    </Suspense>
  );
}

async function QuestionPaperPageContent({ params }: QuestionPaperPageProps) {
  const { paperId, questionId } = await params;

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Suspense fallback={<QuestionHeaderFallback />}>
        <QuestionHeaderSection questionId={questionId} />
      </Suspense>
      <Suspense fallback={<RubricSectionFallback />}>
        <PaperRubricSection questionId={questionId} paperId={paperId} />
      </Suspense>
    </Container>
  );
}

async function QuestionHeaderSection({ questionId }: { questionId: string }) {
  "use cache";
  cacheTag("questions", `questions:${questionId}`);
  const question = await loadQuestion(questionId);

  if (question == null) {
    notFound();
  }

  return (
    <>
      <Box component="header" sx={{ pb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MuiNextLink color="inherit" href="/grading">
            Grading
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

async function PaperRubricSection({
  questionId,
  paperId,
}: {
  questionId: string;
  paperId: string;
}) {
  const [question, papers, gradings] = await Promise.all([
    loadQuestion(questionId),
    loadPapers(),
    loadAssessment(paperId, questionId),
  ]);
  const hasPaper = papers.some((paper) => paper.id === paperId);

  if (question == null || !hasPaper) {
    notFound();
  }

  const rubricsWithGradings = question.rubrics.map((rubric) =>
    attachGrading(rubric, gradings.get(rubric.id)),
  );

  return (
    <PaperGradingClient
      key={`${questionId}-${paperId}`}
      questionId={questionId}
      questionLabel={question.label}
      rubrics={rubricsWithGradings}
      papers={papers}
      currentPaperId={paperId}
    />
  );
}

function PageFallback() {
  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <QuestionHeaderFallback />
      <RubricSectionFallback />
    </Container>
  );
}

function QuestionHeaderFallback() {
  return (
    <Box component="header">
      <MuiSkeleton width={200} height={24} sx={{ mb: 1 }} />
      <MuiSkeleton width="55%" height={54} sx={{ mb: 1 }} />
    </Box>
  );
}

function RubricSectionFallback() {
  return (
    <Box component="section">
      {/* Paper card */}
      <Box
        sx={{
          mb: 2,
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <MuiSkeleton width={100} height={18} />
        <MuiSkeleton width={180} height={38} />
        <MuiSkeleton width={120} height={18} />
      </Box>

      {/* Nav buttons */}
      <Box sx={{ mb: 4, display: "flex", gap: 1 }}>
        <MuiSkeleton variant="rounded" width={160} height={36} />
        <MuiSkeleton variant="rounded" width={120} height={36} />
        <MuiSkeleton
          width={30}
          height={20}
          sx={{ alignSelf: "center", ml: 1 }}
        />
      </Box>

      {/* Rubric rows */}
      {[0, 1, 2].map((i) => (
        <Grid
          key={i}
          container
          spacing={2}
          sx={{ mb: 2, alignItems: "center" }}
        >
          <Grid size={{ xs: 12, sm: 3 }}>
            <MuiSkeleton variant="rounded" width={79} height={39} />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <MuiSkeleton width="80%" height={20} />
          </Grid>
          <Grid size={{ xs: 12, sm: 1 }}>
            <MuiSkeleton width={24} height={20} />
          </Grid>
        </Grid>
      ))}

      {/* Progress summary */}
      <Box sx={{ mt: 2, mb: 2, textAlign: "center" }}>
        <MuiSkeleton width={72} height={28} sx={{ mx: "auto" }} />
        <MuiSkeleton
          variant="rounded"
          width={280}
          height={8}
          sx={{ mx: "auto", mt: 1, borderRadius: 3 }}
        />
        <MuiSkeleton width={120} height={20} sx={{ mx: "auto", mt: 0.5 }} />
      </Box>
    </Box>
  );
}
