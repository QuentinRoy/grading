import { redirect } from "next/navigation";
import { DEFAULT_PROJECT_SLUG } from "@/db/projects";
import { projectDashboardPath } from "@/projects/routes";

export default function HomePage() {
  redirect(projectDashboardPath(DEFAULT_PROJECT_SLUG));
}
