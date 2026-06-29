import type { ReactNode } from "react";

import "../styles/globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { SaveErrorsProvider } from "#design-system/SaveErrorsProvider.tsx";
import SaveErrorsDisplayContainer from "./SaveErrorsDisplayContainer.tsx";

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
						<SaveErrorsDisplayContainer />
					</SaveErrorsProvider>
				</AppRouterCacheProvider>
			</body>
		</html>
	);
}
