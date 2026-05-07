import { prisma } from "./prisma";

export type Paper = {
  id: string;
  label: string;
  team?: string;
};

export default async function loadPapers(): Promise<Paper[]> {
  const papers = await prisma.paper.findMany({
    orderBy: { externalId: "asc" },
  });

  return papers.map((paper) => ({
    id: paper.externalId,
    label: paper.label,
    team: paper.team ?? undefined,
  }));
}
