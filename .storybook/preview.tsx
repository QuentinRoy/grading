import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { CssBaseline, createTheme, ThemeProvider } from "@mui/material";
import type { Preview } from "@storybook/nextjs-vite";
import type { ReactElement, ReactNode } from "react";
import { theme as mantineTheme } from "../src/design-system/theme.ts";

const muiTheme = createTheme();

function MuiDecorator(Story: () => ReactElement): ReactNode {
	return (
		<ThemeProvider theme={muiTheme}>
			<CssBaseline />
			<Story />
		</ThemeProvider>
	);
}

function MantineDecorator(Story: () => ReactElement): ReactNode {
	return (
		<MantineProvider theme={mantineTheme} defaultColorScheme="light">
			<Story />
		</MantineProvider>
	);
}

const preview: Preview = {
	decorators: [MuiDecorator, MantineDecorator],
	parameters: {
		nextjs: { appDirectory: true },
		controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
	},
};

export default preview;
