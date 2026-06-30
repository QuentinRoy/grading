"use client";

import { SegmentedControl, VisuallyHidden } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { ReactElement } from "react";

type BooleanGradeControlProps = {
	value?: boolean | undefined;
	disabled: boolean;
	onAssess: (value: boolean) => void;
};

const UNSET = "";

export default function BooleanGradeControl({
	value,
	disabled,
	onAssess,
}: BooleanGradeControlProps): ReactElement {
	return (
		<SegmentedControl<"true" | "false" | typeof UNSET>
			aria-label="Boolean rubric assessment"
			value={value == null ? UNSET : value ? "true" : "false"}
			onChange={(next) => onAssess(next === "true")}
			disabled={disabled}
			color={value === false ? "red" : "green"}
			data={[
				{
					value: "true",
					label: (
						<>
							<IconCheck size={16} aria-hidden />
							<VisuallyHidden>True</VisuallyHidden>
						</>
					),
				},
				{
					value: "false",
					label: (
						<>
							<IconX size={16} aria-hidden />
							<VisuallyHidden>False</VisuallyHidden>
						</>
					),
				},
			]}
		/>
	);
}
