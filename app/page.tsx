import { redirect } from "next/navigation";
import { loadProjects } from "#db/projects.ts";
import { projectDashboardPath } from "#projects/projectPaths.ts";

export default async function HomePage() {
	const projects = await loadProjects();
	const defaultProject = projects[0];

	if (defaultProject == null) {
		redirect("/projects");
	}

	redirect(projectDashboardPath(defaultProject.id, defaultProject.slug));
}
