export type Rubric =
  | {
      id: string;
      label: string;
      type: "boolean";
      marks: number;
    }
  | {
      id: string;
      label: string;
      type: "ordinal";
      values: Record<string, number>;
    }
  | {
      id: string;
      label: string;
      type: "numerical";
      min: number;
      max: number;
    };

export function getRubricMaxMarks(rubric: Rubric): number {
  if (rubric.type === "boolean") {
    return rubric.marks;
  }

  if (rubric.type === "ordinal") {
    const scores = Object.values(rubric.values);
    return scores.length > 0 ? Math.max(0, ...scores) : 0;
  }

  return rubric.max;
}
