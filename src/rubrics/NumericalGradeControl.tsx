"use client";

import { NumberInput } from "@mantine/core";
import type { ReactElement } from "react";

type NumericalGradeControlProps = {
	value?: number | undefined;
	minScore: number;
	maxScore: number;
	disabled: boolean;
	onAssess: (value: number) => void;
};

export default function NumericalGradeControl({
	value,
	minScore,
	maxScore,
	disabled,
	onAssess,
}: NumericalGradeControlProps): ReactElement {
	function submit(text: string) {
		const trimmed = text.trim();
		if (trimmed.length === 0) {
			return;
		}
		let parsed = Number(trimmed);
		if (!Number.isFinite(parsed) || parsed === value) {
			return;
		}
		if (parsed < minScore) parsed = minScore;
		else if (parsed > maxScore) parsed = maxScore;
		onAssess(parsed);
	}

	return (
		<NumberInput
			key={value ?? "unset"}
			defaultValue={value ?? ""}
			onBlur={(event) => submit(event.currentTarget.value)}
			onKeyDown={(event) => {
				if (event.key === "Enter") {
					event.preventDefault();
					submit(event.currentTarget.value);
				}
			}}
			placeholder="Score"
			disabled={disabled}
			min={minScore}
			max={maxScore}
			clampBehavior="none"
			allowDecimal
			hideControls
			w={96}
		/>
	);
}
