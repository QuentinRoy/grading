import { stringify } from "csv-stringify/sync";
import { loadProjectBySlug } from "@/db/projects";
import { createSubmissionExport } from "@/export/submissionExport";
import { parseExportOptions } from "@/export/submissionExportCsv";

type RouteParams = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteParams,
): Promise<Response> {
  const { projectSlug } = await params;
  const project = await loadProjectBySlug(projectSlug);

  if (project == null) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const searchParams = new URL(request.url).searchParams;

  let options;
  try {
    options = parseExportOptions(searchParams);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }

  const exportData = await createSubmissionExport(options);

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        controller.enqueue(encoder.encode(stringify([exportData.headers])));

        for await (const row of exportData.rows) {
          controller.enqueue(encoder.encode(stringify([row])));
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const filename = `submission-assessments-${project.slug}-${y}${m}${d}.csv`;

  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
