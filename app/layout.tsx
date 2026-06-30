import type { ReactNode } from "react";

import "../styles/globals.css";
import "@mantine/core/styles.css";
import {
	ColorSchemeScript,
	MantineProvider,
	mantineHtmlProps,
} from "@mantine/core";
import Box from "@mui/material/Box";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { SaveErrorsDisplay } from "#app-shell/SaveErrorsDisplay.tsx";
import { SaveErrorsProvider } from "#design-system/SaveErrorsProvider.tsx";
import { theme } from "#design-system/theme.ts";

export const metadata = {
	title: "Assessment",
	description: "Simple assessment helper for rubric-based evaluation",
};

type RootLayoutProps = { children: ReactNode };

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="en" {...mantineHtmlProps}>
			<head>
				<ColorSchemeScript defaultColorScheme="light" />
			</head>
			<body>
				<AppRouterCacheProvider>
					<MantineProvider theme={theme} defaultColorScheme="light">
						<SaveErrorsProvider>
							{children}
							<Box
								sx={{
									position: "fixed",
									bottom: 16,
									left: 16,
									zIndex: 2000,
									maxWidth: 480,
								}}
							>
								<SaveErrorsDisplay />
							</Box>
						</SaveErrorsProvider>
					</MantineProvider>
				</AppRouterCacheProvider>
			</body>
		</html>
	);
}
