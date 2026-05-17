import "server-only";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { db } from "./kysely";

export const DEFAULT_PROJECT_SLUG = "default";

export type ProjectSummary = {
  id: number;
  slug: string;
  name: string;
};

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toProjectSlug(nameOrSlug: string): string {
  const normalized = normalizeSlug(nameOrSlug);
  if (normalized.length === 0) {
    throw new Error("Project name must contain at least one letter or number.");
  }
  if (normalized.length > 64) {
    throw new Error("Project slug must be 64 characters or fewer.");
  }
  return normalized;
}

export async function loadProjects(): Promise<ProjectSummary[]> {
  "use cache";
  cacheTag("projects");
  cacheLife({ revalidate: 60 });

  return db
    .selectFrom("project")
    .select(["id", "slug", "name"])
    .orderBy("name", "asc")
    .execute();
}

export async function loadProjectBySlug(
  slug: string,
): Promise<ProjectSummary | undefined> {
  "use cache";
  cacheTag("projects");
  cacheTag(`projects:${slug}`);
  cacheLife({ revalidate: 60 });

  return db
    .selectFrom("project")
    .select(["id", "slug", "name"])
    .where("slug", "=", slug)
    .executeTakeFirst();
}

export async function createProject(input: {
  name: string;
  slug?: string;
}): Promise<ProjectSummary> {
  const name = input.name.trim();
  if (name.length === 0) {
    throw new Error("Project name is required.");
  }

  const slug = toProjectSlug(input.slug ?? input.name);

  const existing = await db
    .selectFrom("project")
    .select(["id", "slug", "name"])
    .where("slug", "=", slug)
    .executeTakeFirst();

  if (existing != null) {
    throw new Error(`Project slug '${slug}' already exists.`);
  }

  const inserted = await db
    .insertInto("project")
    .values({
      slug,
      name,
    })
    .returning(["id", "slug", "name"])
    .executeTakeFirstOrThrow();

  revalidateTag("projects", "max");
  revalidateTag(`projects:${slug}`, "max");

  return inserted;
}
