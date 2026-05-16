"use client";

export function buildDeleteConfirmationPhrase(
  entityType: string,
  id: string,
  assessmentCount: number,
): string {
  return `delete ${entityType} ${id} (${assessmentCount} assessments)`;
}

export function matchesDeleteConfirmation(
  actual: string,
  expected: string,
): boolean {
  return (
    actual.trim().toLocaleLowerCase() === expected.trim().toLocaleLowerCase()
  );
}
