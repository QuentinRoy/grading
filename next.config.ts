import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	cacheComponents: true,
	cacheLife: {
		// questions, rubrics — writes are the freshness mechanism
		definitions: { revalidate: 60 * 60 },
		// submissions, students — imports are the freshness mechanism
		roster: { revalidate: 60 * 60 },
		// individual assessment values — exact-tag invalidation is the freshness mechanism
		values: { revalidate: 5 * 60 },
		// completion, progress, dashboards — derived and user-visible during grading
		projection: { revalidate: 60 },
		// project list and lookup
		directory: { revalidate: 60 },
	},
};

export default nextConfig;
