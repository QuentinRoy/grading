import { parse as parseCSV } from "csv-parse/sync";
import { assessmentRowsSchema } from "#imports/schemas.ts";
import type { ImportedAssessmentRow } from "#imports/types.ts";

export async function parseAssessmentsCsv(
	content: string,
): Promise<ImportedAssessmentRow[]> {
	const rows = parseCSV(content, { columns: true, skip_empty_lines: true });

	return assessmentRowsSchema.parse(rows);
}
