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
import type { DB } from "./types";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
}));

let container: StartedPostgreSqlContainer;
let db: Kysely<DB>;
let defaultProjectId: number;

let loadAssessment: typeof import("./assessments").loadAssessment;
let saveAssessment: typeof import("./assessments").saveAssessment;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type AssessmentFixture = {
  questionId: string;
  studentId: string;
  submissionId: string;
  rubricIds: {
    boolean: string;
    ordinal: string;
    numerical: string;
  };
};

const fixtures: AssessmentFixture[] = [];

function buildTestId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

function createMigrator(dbInstance: Kysely<DB>): Migrator {
  return new Migrator({
    db: dbInstance,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, "migrations"),
    }),
  });
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

  defaultProjectId = await db
    .selectFrom("project")
    .where("slug", "=", "default")
    .select("id")
    .executeTakeFirstOrThrow()
    .then((row) => row.id);

  vi.doMock("./kysely", () => ({ db }));
  ({ loadAssessment, saveAssessment } = await import("./assessments"));
}, 120_000);

afterAll(async () => {
  await db.destroy();
  await container.stop();
}, 30_000);

async function createAssessmentFixture(): Promise<AssessmentFixture> {
  const questionId = buildTestId("q");
  const studentId = buildTestId("student");
  const booleanRubricId = buildTestId("rubric-boolean");
  const ordinalRubricId = buildTestId("rubric-ordinal");
  const numericalRubricId = buildTestId("rubric-numerical");

  await db
    .insertInto("student")
    .values({
      projectId: defaultProjectId,
      id: studentId,
      lastName: "Integration",
      firstName: "Test",
    })
    .execute();

  const submission = await db
    .insertInto("submission")
    .values({
      projectId: defaultProjectId,
      type: "individual",
      studentId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  await db
    .insertInto("question")
    .values({
      projectId: defaultProjectId,
      id: questionId,
      label: "Integration question",
      position: 0,
    })
    .execute();

  await db
    .insertInto("rubric")
    .values([
      {
        id: booleanRubricId,
        projectId: defaultProjectId,
        questionId,
        type: "boolean",
        position: 0,
        label: "Boolean rubric",
      },
      {
        id: ordinalRubricId,
        projectId: defaultProjectId,
        questionId,
        type: "ordinal",
        position: 1,
        label: "Ordinal rubric",
      },
      {
        id: numericalRubricId,
        projectId: defaultProjectId,
        questionId,
        type: "numerical",
        position: 2,
        label: "Numerical rubric",
      },
    ])
    .execute();

  await db
    .insertInto("booleanRubric")
    .values({
      rubricId: booleanRubricId,
      marks: 2,
    })
    .execute();

  const ordinalRubric = await db
    .insertInto("ordinalRubric")
    .values({
      rubricId: ordinalRubricId,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  await db
    .insertInto("ordinalRubricValue")
    .values([
      {
        ordinalRubricId: ordinalRubric.id,
        label: "A",
        marks: 3,
      },
      {
        ordinalRubricId: ordinalRubric.id,
        label: "B",
        marks: 1,
      },
    ])
    .execute();

  await db
    .insertInto("numericalRubric")
    .values({
      rubricId: numericalRubricId,
      minScore: 0,
      maxScore: 10,
      minMarks: 0,
      maxMarks: 5,
    })
    .execute();

  const fixture = {
    questionId,
    studentId,
    submissionId: String(submission.id),
    rubricIds: {
      boolean: booleanRubricId,
      ordinal: ordinalRubricId,
      numerical: numericalRubricId,
    },
  };

  fixtures.push(fixture);

  return fixture;
}

async function cleanupFixture(fixture: AssessmentFixture): Promise<void> {
  await db
    .deleteFrom("submission")
    .where("id", "=", Number(fixture.submissionId))
    .execute();

  await db
    .deleteFrom("question")
    .where("id", "=", fixture.questionId)
    .execute();

  await db.deleteFrom("student").where("id", "=", fixture.studentId).execute();
}

describe("assessment DB integration", () => {
  afterEach(async () => {
    const pendingCleanup = [...fixtures];
    fixtures.length = 0;

    await Promise.all(pendingCleanup.map((fixture) => cleanupFixture(fixture)));
  });

  it("round-trips boolean, ordinal and numerical assessments", async () => {
    const fixture = await createAssessmentFixture();

    const results = await Promise.all([
      saveAssessment({
        submissionId: fixture.submissionId,
        questionId: fixture.questionId,
        rubric: {
          rubricId: fixture.rubricIds.boolean,
          type: "boolean",
          passed: true,
        },
      }),
      saveAssessment({
        submissionId: fixture.submissionId,
        questionId: fixture.questionId,
        rubric: {
          rubricId: fixture.rubricIds.ordinal,
          type: "ordinal",
          selectedLabel: "B",
        },
      }),
      saveAssessment({
        submissionId: fixture.submissionId,
        questionId: fixture.questionId,
        rubric: {
          rubricId: fixture.rubricIds.numerical,
          type: "numerical",
          score: 7.5,
        },
      }),
    ]);

    expect(results).toEqual([
      { success: true },
      { success: true },
      { success: true },
    ]);

    const loaded = await loadAssessment(
      fixture.submissionId,
      fixture.questionId,
    );

    const byRubricId = new Map(loaded.map((value) => [value.rubricId, value]));

    expect(byRubricId.get(fixture.rubricIds.boolean)).toEqual({
      rubricId: fixture.rubricIds.boolean,
      type: "boolean",
      passed: true,
    });

    expect(byRubricId.get(fixture.rubricIds.ordinal)).toEqual({
      rubricId: fixture.rubricIds.ordinal,
      type: "ordinal",
      selectedLabel: "B",
    });

    expect(byRubricId.get(fixture.rubricIds.numerical)).toEqual({
      rubricId: fixture.rubricIds.numerical,
      type: "numerical",
      score: 7.5,
    });
  });

  it("returns a validation error for invalid ordinal label", async () => {
    const fixture = await createAssessmentFixture();

    const result = await saveAssessment({
      submissionId: fixture.submissionId,
      questionId: fixture.questionId,
      rubric: {
        rubricId: fixture.rubricIds.ordinal,
        type: "ordinal",
        selectedLabel: "Z",
      },
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid ordinal value.",
    });
  });

  it("returns a validation error for out-of-range numerical score", async () => {
    const fixture = await createAssessmentFixture();

    const result = await saveAssessment({
      submissionId: fixture.submissionId,
      questionId: fixture.questionId,
      rubric: {
        rubricId: fixture.rubricIds.numerical,
        type: "numerical",
        score: 11,
      },
    });

    expect(result).toEqual({
      success: false,
      error: "Score must be at most 10.",
    });
  });
});
