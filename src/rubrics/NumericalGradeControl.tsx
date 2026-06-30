"use client";

import { NumberInput } from "@mantine/core";
import { type ReactElement, useEffect, useState } from "react";

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
	const [draft, setDraft] = useState<string | number>(value ?? "");

	useEffect(() => {
		setDraft(value ?? "");
	}, [value]);

	function submit() {
		const trimmed = String(draft).trim();
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
			value={draft}
			onChange={setDraft}
			onBlur={submit}
			onKeyDown={(event) => {
				if (event.key === "Enter") {
					event.preventDefault();
					submit();
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
