import { fireEvent, render, screen, within } from "@testing-library/react";

import { MainNav } from "./main-nav";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/i18n/language-context", () => ({
  useLanguage: () => ({ language: "en", setLanguage: jest.fn() }),
}));

jest.mock("@/lib/supabase/auth-client", () => ({
  checkClientAuth: jest.fn().mockResolvedValue({ hasRole: false }),
}));

test("labels /me as My Path and omits /plan from desktop navigation", () => {
  render(<MainNav isAuthenticated />);

  const desktopNavigation = screen.getByRole("navigation");
  expect(
    within(desktopNavigation).getByRole("link", { name: "My Path" })
  ).toHaveAttribute("href", "/me");
  expect(desktopNavigation.querySelector('a[href="/plan"]')).toBeNull();
});

test("labels /me as My Path and omits /plan from mobile navigation", async () => {
  render(<MainNav isAuthenticated />);

  fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
  const mobileNavigation = (await screen.findByText("Navigation")).closest("nav");

  expect(mobileNavigation).not.toBeNull();
  expect(
    within(mobileNavigation!).getByRole("link", { name: "My Path" })
  ).toHaveAttribute("href", "/me");
  expect(mobileNavigation!.querySelector('a[href="/plan"]')).toBeNull();
});
