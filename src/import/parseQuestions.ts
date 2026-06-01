import yaml from "js-yaml";
import { questionsSchema } from "./schemas.ts";
import type { ImportedQuestion } from "./types.ts";

export function parseQuestionsYaml(content: string): ImportedQuestion[] {
	const parsed = yaml.load(content);
	return questionsSchema.parse(parsed).questions;
}
