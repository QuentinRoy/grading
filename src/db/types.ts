import type { Simplify } from "#utils/utils.ts";
import type { RubricType } from "./generated/db.ts";

// Policy: keep schema-correlated types in this file derived from generated DB
// types to prevent drift, while exposing only curated app-facing contracts (no
// broad generated table-shape re-export from here).
export type { RubricType };

type RubricBase = {
	id: string;
	description?: string | undefined;
	label?: string | undefined;
	type: RubricType;
};

export type Rubric =
	| Simplify<
			RubricBase & { type: "boolean"; marks: number; falseMarks: number }
	  >
	| Simplify<RubricBase & { type: "ordinal"; marks: Record<string, number> }>
	| Simplify<
			RubricBase & {
				type: "numerical";
				minScore: number;
				maxScore: number;
				minMarks: number;
				maxMarks: number;
				reversed: boolean;
			}
	  >;
