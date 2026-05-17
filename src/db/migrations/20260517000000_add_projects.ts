import { type Kysely, sql } from "kysely";

const DEFAULT_PROJECT_SLUG = "default";
const DEFAULT_PROJECT_NAME = "Default";

type ProjectRow = {
  id: number;
};

async function addProjectIdColumn(params: {
  db: Kysely<unknown>;
  tableName: string;
  defaultProjectId: number;
  constraintName: string;
}): Promise<void> {
  const { db, tableName, defaultProjectId, constraintName } = params;
  const defaultProjectIdSql = sql.raw(String(defaultProjectId));

  await sql`
    ALTER TABLE ${sql.table(tableName)}
    ADD COLUMN project_id integer;
  `.execute(db);

  await sql`
    UPDATE ${sql.table(tableName)}
    SET project_id = ${defaultProjectIdSql}
    WHERE project_id IS NULL;
  `.execute(db);

  await sql`
    ALTER TABLE ${sql.table(tableName)}
    ALTER COLUMN project_id SET NOT NULL;
  `.execute(db);

  await sql`
    ALTER TABLE ${sql.table(tableName)}
    ADD CONSTRAINT ${sql.id(constraintName)}
    FOREIGN KEY (project_id)
    REFERENCES project(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  `.execute(db);

  await sql`
    CREATE INDEX ${sql.id(`${tableName}_project_id_idx`)}
    ON ${sql.table(tableName)} (project_id);
  `.execute(db);
}

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("project")
    .addColumn("id", "integer", (column) =>
      column.generatedAlwaysAsIdentity().primaryKey().notNull(),
    )
    .addColumn("slug", "text", (column) => column.notNull().unique())
    .addColumn("name", "text", (column) => column.notNull())
    .addColumn("created_at", "timestamp(3)", (column) =>
      column.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "timestamp(3)", (column) =>
      column.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();

  await sql`
    INSERT INTO project (slug, name)
    VALUES (${DEFAULT_PROJECT_SLUG}, ${DEFAULT_PROJECT_NAME})
    ON CONFLICT (slug) DO NOTHING;
  `.execute(db);

  const defaultProject = await sql<ProjectRow>`
    SELECT id
    FROM project
    WHERE slug = ${DEFAULT_PROJECT_SLUG}
    LIMIT 1;
  `.execute(db);

  const defaultProjectId = defaultProject.rows[0]?.id;

  if (defaultProjectId == null) {
    throw new Error("Default project could not be resolved in migration.");
  }

  await addProjectIdColumn({
    db,
    tableName: "question",
    defaultProjectId,
    constraintName: "Question_projectId_fkey",
  });

  await addProjectIdColumn({
    db,
    tableName: "rubric",
    defaultProjectId,
    constraintName: "Rubric_projectId_fkey",
  });

  await addProjectIdColumn({
    db,
    tableName: "student",
    defaultProjectId,
    constraintName: "Student_projectId_fkey",
  });

  await addProjectIdColumn({
    db,
    tableName: "team",
    defaultProjectId,
    constraintName: "Team_projectId_fkey",
  });

  await addProjectIdColumn({
    db,
    tableName: "submission",
    defaultProjectId,
    constraintName: "Submission_projectId_fkey",
  });

  await addProjectIdColumn({
    db,
    tableName: "assessment",
    defaultProjectId,
    constraintName: "Assessment_projectId_fkey",
  });
}

export async function down(db: Kysely<unknown>): Promise<void> {
  const tables = [
    "assessment",
    "submission",
    "team",
    "student",
    "rubric",
    "question",
  ];

  for (const tableName of tables) {
    await sql`
      DROP INDEX IF EXISTS ${sql.id(`${tableName}_project_id_idx`)};
    `.execute(db);

    await sql`
      ALTER TABLE ${sql.table(tableName)}
      DROP COLUMN IF EXISTS project_id;
    `.execute(db);
  }

  await db.schema.dropTable("project").ifExists().execute();
}
