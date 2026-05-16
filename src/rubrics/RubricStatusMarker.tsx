"use client";

import { keyframes } from "@emotion/react";
import type { Theme } from "@mui/material";
import Box from "@mui/material/Box";
import type { ReactElement } from "react";
import { assertNever } from "@/utils/utils";

type RubricStatusMarkerProps = {
  status: "unassessed" | "saving" | "assessed";
};

const savingPulse = keyframes`
  0% {
    transform: scale(1);
  }

  25% {
    transform: scale(0.8);
  }

  50% {
    transform: scale(1.2);
  }

  75% {
    transform: scale(0.8);
  }

  100% {
    transform: scale(1);
  }
`;

function getStatusColor(
  status: RubricStatusMarkerProps["status"],
  theme: Theme,
) {
  switch (status) {
    case "unassessed":
      return theme.palette.secondary.light;
    case "saving":
      return theme.palette.warning.light;
    case "assessed":
      return theme.palette.success.light;
    default:
      assertNever(status);
  }
}

export default function RubricStatusMarker({
  status,
}: RubricStatusMarkerProps): ReactElement {
  return (
    <Box
      aria-hidden
      sx={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={(theme) => ({
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: getStatusColor(status, theme),
          transform: status === "saving" ? undefined : "scale(1)",
          transition: theme.transitions.create(
            ["background-color", "transform"],
            {
              duration: theme.transitions.duration.shortest,
              easing: theme.transitions.easing.easeInOut,
            },
          ),
          animation:
            status === "saving"
              ? `${savingPulse} 1.2s ease-in-out infinite`
              : "none",
        })}
      />
    </Box>
  );
}
