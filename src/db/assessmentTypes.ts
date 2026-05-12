// boolean is used by boolean rubrics,
// string is used by ordinal rubrics (the label of the selected mark),
// and number is used by numerical rubrics.
export type RubricGrading = boolean | string | number;

export type SaveRubricGradingResult =
  | { success: true }
  | { success: false; error: string };

export type SaveRubricGradingParams = {
  paperId: string;
  questionId: string;
  rubricId: string;
  grading: RubricGrading;
};