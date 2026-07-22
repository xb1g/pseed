import { render, screen } from "@testing-library/react";

import PortalPage from "./page";
import { buildMyPathDashboard } from "@/lib/my-path/dashboard";
import { loadMyPathDashboardSource } from "@/lib/my-path/dashboard-read";
import { loadPersistedMyPathResult } from "@/lib/my-path/server-read";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/components/my-path/MyPathDashboard", () => ({
  MyPathDashboard: ({ model }: { model: { nextAction: { title: string } } }) => (
    <div>My Path model: {model.nextAction.title}</div>
  ),
}));

const supabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: "user-a",
          email: "student@example.com",
          user_metadata: {},
        },
      },
    }),
  },
};

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn().mockImplementation(() => Promise.resolve(supabase)),
}));

jest.mock("@/lib/my-path/server-read", () => ({
  loadPersistedMyPathResult: jest.fn().mockResolvedValue({
    status: "ready",
    state: { hasPersistedPath: true, draft: {}, evidence: [] },
  }),
}));

jest.mock("@/lib/my-path/dashboard-read", () => ({
  loadMyPathDashboardSource: jest.fn().mockResolvedValue({
    enrollments: [],
    trials: [],
    progress: [],
  }),
}));

jest.mock("@/lib/my-path/dashboard", () => ({
  buildMyPathDashboard: jest.fn().mockReturnValue({
    nextAction: { title: "เลือก PathLab ที่จะทดลองจริง" },
  }),
}));

test("server-loads and composes the signed-in student's My Path dashboard", async () => {
  render(await PortalPage());

  expect(loadPersistedMyPathResult).toHaveBeenCalledWith(supabase);
  expect(loadMyPathDashboardSource).toHaveBeenCalledWith(supabase, "user-a");
  expect(buildMyPathDashboard).toHaveBeenCalledWith({
    persistedPath: { hasPersistedPath: true, draft: {}, evidence: [] },
    persistedPathStatus: "ready",
    enrollments: [],
    trials: [],
    progress: [],
  });
  expect(screen.getByText(/My Path model: เลือก PathLab/)).toBeInTheDocument();
});

test("exposes the My Path fragment target on the page landmark", async () => {
  render(await PortalPage());

  expect(screen.getByRole("main")).toHaveAttribute("id", "my-path");
  expect(screen.getByRole("main")).toHaveClass("dawn-theme");
});
