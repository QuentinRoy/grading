import yaml from "js-yaml";
import { questionsSchema } from "#imports/schemas.ts";
import type { ImportedQuestion } from "#imports/types.ts";

export function parseQuestionsYaml(content: string): ImportedQuestion[] {
	const parsed = yaml.load(content);
	return questionsSchema.parse(parsed).questions;
}
