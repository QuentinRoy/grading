import type { ImportState } from "#import/importState.ts";
import type { QuestionsFieldErrors } from "./errors.ts";

export type QuestionsActionState = Omit<ImportState, "errors"> & {
	fieldErrors?: QuestionsFieldErrors;
	formErrors?: string[];
};

export const initialQuestionsActionState: QuestionsActionState = {
	status: "idle",
};
