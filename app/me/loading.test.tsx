import { render, screen } from "@testing-library/react";

import Loading from "./loading";

test("shows a calm Dawn dashboard skeleton instead of a central spinner", () => {
  const { container } = render(<Loading />);

  expect(screen.getByRole("status", { name: /กำลังเตรียม My Path/ })).toBeInTheDocument();
  expect(container.firstElementChild).toHaveClass("dawn-theme");
  expect(container.querySelectorAll(".ei-skeleton").length).toBeGreaterThan(2);
  expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
});
