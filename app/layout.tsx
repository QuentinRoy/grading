import type { ReactNode } from "react";

import "../styles/globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { SaveErrorsDisplay } from "#design-system/SaveErrorsDisplay.tsx";
import { SaveErrorsProvider } from "#design-system/SaveErrorsProvider.tsx";
import { projectAssessmentSubmissionQuestionPath } from "#projects/projectPaths.ts";

export const metadata = {
	title: "Assessment",
	description: "Simple assessment helper for rubric-based evaluation",
};

type RootLayoutProps = { children: ReactNode };

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="en">
			<body>
				<AppRouterCacheProvider>
					<SaveErrorsProvider>
						{children}
						<SaveErrorsDisplay
							buildErrorHref={(error) =>
								projectAssessmentSubmissionQuestionPath(
									error.projectId,
									error.projectSlug,
									error.submissionId,
									error.questionId,
								)
							}
						/>
					</SaveErrorsProvider>
				</AppRouterCacheProvider>
			</body>
		</html>
	);
}
