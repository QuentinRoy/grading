"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { produce } from "immer";
import NextLink from "next/link";
import {
  type ReactElement,
  startTransition,
  useMemo,
  useOptimistic,
  useReducer,
} from "react";
import type { Paper } from "../papers/loadPapers";
import { getRubricMaxMarks } from "../rubrics/rubric";
import { useSaveErrors } from "../shared/SaveErrorsProvider";
import GradingProgressSummary from "./GradingProgressSummary";
import { attachGrading, type GradedRubric, type Grading } from "./grading";
import RubricGradeList from "./RubricGradeList";
import { saveRubricGrading } from "./saveRubricGrading";

type GradingUpdate = { index: number; grading: Grading };

type State = {
  savedRubrics: GradedRubric[];
  pendingByIndex: Record<number, number>;
};

type Action =
  | {
      type: "save-start";
      index: number;
    }
  | {
      type: "save-success";
      index: number;
      grading: Grading;
    }
  | {
      type: "save-failure";
      index: number;
    };

type PaperGradingClientProps = {
  questionId: string;
  questionLabel?: string;
  rubrics: GradedRubric[];
  papers: Paper[];
  currentPaperId: string;
};

export default function PaperGradingClient({
  questionId,
  questionLabel,
  rubrics: initialRubrics,
  papers,
  currentPaperId,
}: PaperGradingClientProps): ReactElement {
  const { addError } = useSaveErrors();

  const [{ savedRubrics, pendingByIndex }, dispatch] = useReducer(reducer, {
    savedRubrics: initialRubrics,
    pendingByIndex: {},
  });

  const [optimisticRubrics, addOptimisticUpdate] = useOptimistic(
    savedRubrics,
    (current: GradedRubric[], { index, grading }: GradingUpdate) =>
      current.map((rubric, currentIndex) =>
        currentIndex === index ? attachGrading(rubric, grading) : rubric,
      ),
  );

  const { currentPaperIndex, currentPaper, previousPaper, nextPaper } =
    useMemo(() => {
      const currentPaperIndex = papers.findIndex(
        (paper) => paper.id === currentPaperId,
      );
      const currentPaper =
        currentPaperIndex === -1 ? undefined : papers[currentPaperIndex];
      const previousPaper =
        currentPaperIndex > 0 ? papers[currentPaperIndex - 1] : undefined;
      const nextPaper =
        currentPaperIndex >= 0 && currentPaperIndex < papers.length - 1
          ? papers[currentPaperIndex + 1]
          : undefined;
      return { currentPaperIndex, currentPaper, previousPaper, nextPaper };
    }, [papers, currentPaperId]);

  let marks = 0;
  let maxMarks = 0;
  let totalRubricsLeft = 0;

  optimisticRubrics.forEach((rubric) => {
    const { grading } = rubric;
    const rubricMarks = getRubricMaxMarks(rubric);

    if (grading != null) {
      if (rubric.type === "boolean") {
        if (grading === true) {
          marks += rubricMarks;
        }
      } else if (rubric.type === "ordinal") {
        if (typeof grading === "string") {
          marks += rubric.values[grading] ?? 0;
        }
      } else {
        if (typeof grading === "number") {
          marks += grading;
        }
      }
    }

    if (grading != null) {
      maxMarks += rubricMarks;
    } else {
      totalRubricsLeft += 1;
    }
  });

  const completedRubrics = optimisticRubrics.length - totalRubricsLeft;
  const isCompleted = totalRubricsLeft === 0 && optimisticRubrics.length > 0;

  function handleGrade(index: number, grading: string | number | boolean) {
    const rubric = savedRubrics[index];
    const currentGrading = optimisticRubrics[index]?.grading;
    if (rubric == null || currentGrading === grading) {
      return;
    }

    dispatch({ type: "save-start", index });

    startTransition(async () => {
      addOptimisticUpdate({ index, grading });
      const result = await saveRubricGrading({
        paperId: currentPaperId,
        questionId,
        rubricId: rubric.id,
        grading,
      });
      if (result.success) {
        dispatch({ type: "save-success", index, grading });
      } else {
        dispatch({ type: "save-failure", index });
        addError({
          questionId,
          paperId: currentPaperId,
          questionLabel,
          paperLabel: currentPaper?.label,
          message: result.error,
        });
      }
    });
  }

  return (
    <>
      {currentPaper == null ? (
        <Typography variant="body1" sx={{ mb: 3 }}>
          No papers found in database.
        </Typography>
      ) : (
        <>
          <Box
            sx={{
              mb: 2,
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Current paper
            </Typography>
            <Typography variant="h6">{currentPaper.label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {currentPaper.id}
            </Typography>
          </Box>

          <Box sx={{ mb: 4, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              component={NextLink}
              href={`/grading/papers/${previousPaper?.id ?? currentPaperId}/questions/${questionId}`}
              variant="outlined"
              color={isCompleted ? "primary" : "secondary"}
              disabled={previousPaper == null}
            >
              Previous paper
            </Button>
            <Button
              component={NextLink}
              href={`/grading/papers/${nextPaper?.id ?? currentPaperId}/questions/${questionId}`}
              variant="outlined"
              color={isCompleted ? "primary" : "secondary"}
              disabled={nextPaper == null}
            >
              Next paper
            </Button>
            <Typography variant="body2" sx={{ alignSelf: "center", ml: 1 }}>
              {currentPaperIndex + 1} / {papers.length}
            </Typography>
          </Box>
        </>
      )}

      <RubricGradeList
        rubrics={optimisticRubrics}
        pendingByIndex={pendingByIndex}
        disabled={currentPaper == null}
        onGrade={handleGrade}
      />

      <GradingProgressSummary
        marks={marks}
        maxMarks={maxMarks}
        completedRubrics={completedRubrics}
        totalRubrics={optimisticRubrics.length}
      />
    </>
  );
}

function reducer(state: State, action: Action): State {
  return produce(state, (draft) => {
    switch (action.type) {
      case "save-start": {
        const current = draft.pendingByIndex[action.index] ?? 0;
        draft.pendingByIndex[action.index] = current + 1;
        break;
      }
      case "save-success": {
        const nextPending = Math.max(
          0,
          (draft.pendingByIndex[action.index] ?? 0) - 1,
        );
        draft.pendingByIndex[action.index] = nextPending;
        if (draft.savedRubrics[action.index] != null) {
          draft.savedRubrics[action.index] = attachGrading(
            draft.savedRubrics[action.index],
            action.grading,
          );
        }
        break;
      }
      case "save-failure": {
        const nextPending = Math.max(
          0,
          (draft.pendingByIndex[action.index] ?? 0) - 1,
        );
        draft.pendingByIndex[action.index] = nextPending;
        break;
      }
      default:
        break;
    }
  });
}
