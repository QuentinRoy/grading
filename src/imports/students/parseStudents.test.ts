import { describe, expect, it } from "vitest";
import {
	groupStudentsIntoSubmissions,
	parseStudentsCsv,
} from "./parseStudents.ts";

describe("parseStudentsCsv", () => {
	it("parses required columns and optional team", () => {
		const students = parseStudentsCsv(`last_name,first_name,id,team
Smith,Alice,s1,
Jones,Bob,s2,Team A`);

		expect(students).toEqual([
			{ lastName: "Smith", firstName: "Alice", id: "s1" },
			{ lastName: "Jones", firstName: "Bob", id: "s2", team: "Team A" },
		]);
	});
});

describe("groupStudentsIntoSubmissions", () => {
	it("groups team students and creates individual submissions", () => {
		const students = [
			{ lastName: "Smith", firstName: "Alice", id: "s1" },
			{ lastName: "Jones", firstName: "Bob", id: "s2", team: "Team A" },
			{ lastName: "Ray", firstName: "Cora", id: "s3", team: "Team A" },
		];

		const submissions = groupStudentsIntoSubmissions(students);

		expect(submissions).toHaveLength(2);

		const teamSubmission = submissions.find(
			(submission) => submission.type === "team",
		);
		expect(teamSubmission).toBeDefined();
		expect(teamSubmission?.students).toHaveLength(2);

		const individualSubmission = submissions.find(
			(submission) => submission.type === "individual",
		);
		expect(individualSubmission).toBeDefined();
		expect(individualSubmission?.students[0]?.id).toBe("s1");
	});

	it("generates unique submission ids when team slugs collide", () => {
		const students = [
			{ lastName: "One", firstName: "Alpha", id: "s1", team: "Team A" },
			{ lastName: "Two", firstName: "Beta", id: "s2", team: "Team-A" },
		];

		const submissions = groupStudentsIntoSubmissions(students);
		const teamIds = submissions
			.filter((submission) => submission.type === "team")
			.map((submission) => submission.id)
			.sort((a, b) => a.localeCompare(b));

		expect(teamIds).toEqual(["team-team-a", "team-team-a-2"]);
	});
});
