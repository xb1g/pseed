import { render, screen } from "@testing-library/react";

import PortalPage from "./page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/components/user-portal", () => ({
  UserPortal: () => <div>Dashboard content</div>,
}));

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            email: "student@example.com",
            user_metadata: {},
          },
        },
      }),
    },
  }),
}));

jest.mock("@/lib/supabase/reflection", () => ({
  getUserDashboardData: jest.fn().mockResolvedValue({}),
}));

test("exposes the My Path fragment target on the page landmark", async () => {
  render(await PortalPage());

  expect(screen.getByRole("main")).toHaveAttribute("id", "my-path");
});
