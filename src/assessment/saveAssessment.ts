"use server";

import {
	type SaveAssessmentParams,
	saveAssessment as saveAssessmentInDb,
} from "#assessment/assessmentMutations.ts";

export async function saveAssessment(params: SaveAssessmentParams) {
	return saveAssessmentInDb(params);
}
