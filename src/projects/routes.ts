export function projectBasePath(projectSlug: string): string {
  return `/projects/${projectSlug}`;
}

export function projectDashboardPath(projectSlug: string): string {
  return projectBasePath(projectSlug);
}

export function changeProjectPath(): string {
  return "/projects";
}

export function projectAssessmentsPath(projectSlug: string): string {
  return `${projectBasePath(projectSlug)}/assessments`;
}

export function projectOverviewPath(projectSlug: string): string {
  return `${projectBasePath(projectSlug)}/assessments/overview`;
}

export function projectQuestionsPath(projectSlug: string): string {
  return `${projectBasePath(projectSlug)}/questions`;
}

export function projectImportQuestionsPath(projectSlug: string): string {
  return `${projectBasePath(projectSlug)}/import/questions`;
}

export function projectImportStudentsPath(projectSlug: string): string {
  return `${projectBasePath(projectSlug)}/import/students`;
}

export function projectImportAssessmentsPath(projectSlug: string): string {
  return `${projectBasePath(projectSlug)}/import/assessments`;
}

export function projectExportSubmissionsPath(projectSlug: string): string {
  return `${projectBasePath(projectSlug)}/export/submissions`;
}

export function projectExportQuestionsPath(projectSlug: string): string {
  return `${projectBasePath(projectSlug)}/export/questions`;
}
