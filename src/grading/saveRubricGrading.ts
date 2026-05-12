"use server";

import type { SaveRubricGradingParams } from "../db/assessmentTypes";
import { saveRubricGrading as saveRubricGradingInDb } from "../db/saveRubricGrading";

export async function saveRubricGrading(params: SaveRubricGradingParams) {
  return saveRubricGradingInDb(params);
}