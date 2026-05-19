import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, userEvent } from "storybook/test";
import AppShell from "./AppShell";

const meta = {
  title: "Shared/AppShell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      navigation: {
        pathname: "/projects/123/test-project",
      },
    },
  },
  args: {
    showNavigation: true,
    children: <p>Page content</p>,
  },
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithNavigation: Story = {};

export const WithoutNavigation: Story = {
  args: { showNavigation: false },
};

export const DrawerOpens: Story = {
  play: async () => {
    const hamburger = screen.getByRole("button", {
      name: /open navigation drawer/i,
    });
    await userEvent.click(hamburger);

    // DrawerContent renders "Navigation" as the drawer title.
    // The Drawer renders into a portal in document.body, so use screen (not canvas).
    await expect(await screen.findByText("Navigation")).toBeVisible();
  },
};
