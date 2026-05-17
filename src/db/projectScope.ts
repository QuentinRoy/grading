export function withProjectScope<T>(
  value: T,
  projectId: number | undefined,
  scope: (value: T, projectId: number) => T,
): T {
  if (projectId == null) {
    return value;
  }

  return scope(value, projectId);
}
