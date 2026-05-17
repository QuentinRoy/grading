import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { DB } from "../db/types";
import type { NormalizedImportedSubmission } from "./types";

vi.mock("server-only", () => ({}));

let container: StartedPostgreSqlContainer;
let db: Kysely<DB>;

let saveStudents: typeof import("./saveStudents").saveStudents;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createdProjectIds: number[] = [];

function buildTestId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

function createMigrator(dbInstance: Kysely<DB>): Migrator {
  return new Migrator({
    db: dbInstance,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, "../db/migrations"),
    }),
  });
}

async function createProject(name: string): Promise<number> {
  const project = await db
    .insertInto("project")
    .values({
      publicId: buildTestId("project"),
      name,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  createdProjectIds.push(project.id);
  return project.id;
}

function makeSubmissions(
  sharedStudentId: string,
  sharedTeamName: string,
): NormalizedImportedSubmission[] {
  return [
    {
      id: `submission-${sharedStudentId}`,
      type: "individual",
      students: [
        {
          id: sharedStudentId,
          lastName: "Shared",
          firstName: "Student",
        },
      ],
    },
    {
      id: `submission-${sharedTeamName}`,
      type: "team",
      team: sharedTeamName,
      students: [
        {
          id: `${sharedTeamName}-member`,
          lastName: "Team",
          firstName: "Member",
        },
      ],
    },
  ];
}

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:17-alpine").start();

  db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: container.getConnectionUri() }),
    }),
    plugins: [new CamelCasePlugin()],
  });

  const migrator = createMigrator(db);
  const { error } = await migrator.migrateToLatest();

  if (error != null) {
    throw error;
  }

  vi.doMock("../db/kysely", () => ({ db }));
  ({ saveStudents } = await import("./saveStudents"));
}, 120_000);

afterAll(async () => {
  await db.destroy();
  await container.stop();
}, 30_000);

afterEach(async () => {
  if (createdProjectIds.length === 0) {
    return;
  }

  await db.deleteFrom("project").where("id", "in", createdProjectIds).execute();
  createdProjectIds.length = 0;
});

describe("saveStudents", () => {
  it("keeps imported student ids and team names isolated per project", async () => {
    const projectAId = await createProject("Project A");
    const projectBId = await createProject("Project B");

    const sharedStudentId = "shared-student";
    const sharedTeamName = "Shared Team";

    const resultA = await saveStudents(
      makeSubmissions(sharedStudentId, sharedTeamName),
      projectAId,
    );
    const resultB = await saveStudents(
      makeSubmissions(sharedStudentId, sharedTeamName),
      projectBId,
    );

    expect(resultA).toEqual({ submissionCount: 2, studentCount: 2 });
    expect(resultB).toEqual({ submissionCount: 2, studentCount: 2 });

    const studentRows = await db
      .selectFrom("student")
      .select(["id", "rowId", "projectId"])
      .where("id", "in", [sharedStudentId, `${sharedTeamName}-member`])
      .orderBy("projectId", "asc")
      .orderBy("id", "asc")
      .execute();

    expect(studentRows).toHaveLength(4);
    expect(
      studentRows
        .filter((row) => row.id === sharedStudentId)
        .map((row) => row.rowId),
    ).toHaveLength(2);
    expect(
      new Set(
        studentRows
          .filter((row) => row.id === sharedStudentId)
          .map((row) => row.rowId),
      ).size,
    ).toBe(2);

    const teamRows = await db
      .selectFrom("team")
      .select(["id", "name", "projectId"])
      .where("name", "=", sharedTeamName)
      .orderBy("projectId", "asc")
      .execute();

    expect(teamRows).toHaveLength(2);
    expect(new Set(teamRows.map((row) => row.projectId)).size).toBe(2);

    const individualSubmissions = await db
      .selectFrom("submission")
      .innerJoin("student", "student.rowId", "submission.studentId")
      .select([
        "submission.id as submissionId",
        "submission.projectId as projectId",
        "student.id as studentId",
        "student.rowId as studentRowId",
      ])
      .where("submission.type", "=", "individual")
      .orderBy("submission.projectId", "asc")
      .execute();

    expect(individualSubmissions).toHaveLength(2);
    expect(individualSubmissions.map((row) => row.studentId)).toEqual([
      sharedStudentId,
      sharedStudentId,
    ]);
    expect(
      new Set(individualSubmissions.map((row) => row.studentRowId)).size,
    ).toBe(2);
  });
});
