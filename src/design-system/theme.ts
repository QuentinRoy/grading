import { createTheme } from "@mantine/core";

/**
 * App-wide Mantine theme. Light scheme only (see ADR 0011). Spacing and
 * fontSizes are tuned slightly below Mantine defaults for a compact-leaning
 * density; per-component defaults are refined against the marking view in
 * the assessment-capture migration step.
 */
export const theme = createTheme({
	primaryColor: "indigo",
	defaultRadius: "sm",
	spacing: {
		xs: "0.5rem",
		sm: "0.625rem",
		md: "0.875rem",
		lg: "1.25rem",
		xl: "1.75rem",
	},
	fontSizes: {
		xs: "0.6875rem",
		sm: "0.8125rem",
		md: "0.875rem",
		lg: "1rem",
		xl: "1.125rem",
	},
});
