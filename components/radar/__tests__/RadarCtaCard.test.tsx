import { render, screen } from "@testing-library/react";

import { RadarCardView } from "../RadarCards";

jest.mock("@/components/radar/OglTrendBackground", () => ({
  OglTrendBackground: () => null,
}));

test("cta card links to the TechSeed signup page", () => {
  render(
    <RadarCardView kind="cta" accent="#60a5fa" content={{ title: "Next Step" }} />
  );

  const link = screen.getByRole("link", { name: /สมัคร TechSeed รุ่น 6/ });
  expect(link).toHaveAttribute("href", "/techseed");
});

test("cta card renders resource chips as real external links", () => {
  render(
    <RadarCardView
      kind="cta"
      accent="#60a5fa"
      content={{
        title: "Next Step",
        resources: [
          { label: "TryHackMe", url: "https://tryhackme.com" },
          { label: "HackTheBox", url: "https://www.hackthebox.com" },
        ],
      }}
    />
  );

  expect(screen.getByRole("link", { name: /TryHackMe/ })).toHaveAttribute(
    "href",
    "https://tryhackme.com"
  );
  expect(screen.getByRole("link", { name: /HackTheBox/ })).toHaveAttribute(
    "href",
    "https://www.hackthebox.com"
  );
});

test("cta card keeps the mentor CTA and hides the resources block when empty", () => {
  render(
    <RadarCardView kind="cta" accent="#60a5fa" content={{ title: "Next Step" }} />
  );

  expect(
    screen.getByRole("button", { name: "นัดคุยกับรุ่นพี่" })
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/ลองเล่นด้วยตัวเองก่อน/)
  ).not.toBeInTheDocument();
});
