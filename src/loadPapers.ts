import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "./prisma";

export type Paper = {
  id: string;
  label: string;
  team?: string;
};

async function loadPapersFromDb() {
  "use cache";
  cacheTag("papers");
  cacheLife({ revalidate: 60 });
  return prisma.paper.findMany({
    orderBy: { id: "asc" },
  });
}

export default async function loadPapers(): Promise<Paper[]> {
  const papers = await loadPapersFromDb();

  return papers.map((paper) => ({
    id: paper.id,
    label: paper.label,
    team: paper.team ?? undefined,
  }));
}
