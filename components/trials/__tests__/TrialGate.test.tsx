import { render, screen } from "@testing-library/react";

import { TrialGate } from "../TrialGate";

test("describes an expired trial as locked recovery, not open access", () => {
  render(
    <TrialGate
      seedId="seed-a"
      seedTitle="AI Builder"
      trial={{
        payToken: "0123456789abcdef0123456789abcdef",
        payUrl: "/pay/0123456789abcdef0123456789abcdef",
        paymentDeadline: "2026-07-21T00:00:00.000Z",
      }}
    />
  );

  expect(screen.getByText(/ครบ 24 ชม. แล้ว/)).toBeVisible();
  expect(screen.getByText(/ชำระและปลดล็อก PathLab ต่อ/)).toBeVisible();
  expect(screen.queryByText(/การทดลองของคุณเปิดแล้ว/)).not.toBeInTheDocument();
});
