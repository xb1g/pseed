import { fireEvent, render, screen } from "@testing-library/react";

import { ParentUpdateOptIn } from "../ParentUpdateOptIn";

const TOKEN = "0123456789abcdef0123456789abcdef";

beforeEach(() => {
  global.fetch = jest.fn();
});

test("requires a valid email, explicit consent, and recipient attestation", async () => {
  render(<ParentUpdateOptIn token={TOKEN} />);

  fireEvent.change(screen.getByLabelText("อีเมลผู้ปกครอง"), {
    target: { value: "not-an-email" },
  });
  fireEvent.click(screen.getByRole("button", { name: "ส่งอีเมลยืนยัน" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "กรุณากรอกอีเมลให้ถูกต้อง"
  );
  expect(screen.getByLabelText("อีเมลผู้ปกครอง")).toHaveAttribute(
    "aria-invalid",
    "true"
  );
  expect(global.fetch).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText("อีเมลผู้ปกครอง"), {
    target: { value: "parent@example.com" },
  });
  fireEvent.click(screen.getByLabelText(/ข้าพเจ้าเป็นผู้ปกครอง\/ผู้ดูแล/));
  fireEvent.click(screen.getByLabelText(/ยินยอมรับอีเมลอัปเดต/));
  expect(screen.getByRole("button", { name: "ลองส่งอีกครั้ง" })).toBeEnabled();
});

test("announces progress and the verification-sent state", async () => {
  let resolveRequest: ((value: Response) => void) | undefined;
  (global.fetch as jest.Mock).mockReturnValue(
    new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    })
  );
  render(<ParentUpdateOptIn token={TOKEN} />);

  fireEvent.change(screen.getByLabelText("อีเมลผู้ปกครอง"), {
    target: { value: " Parent@Example.com " },
  });
  fireEvent.click(screen.getByLabelText(/ข้าพเจ้าเป็นผู้ปกครอง\/ผู้ดูแล/));
  fireEvent.click(screen.getByLabelText(/ยินยอมรับอีเมลอัปเดต/));
  fireEvent.click(screen.getByRole("button", { name: "ส่งอีเมลยืนยัน" }));

  expect(
    screen.getByRole("button", { name: "กำลังส่งอีเมลยืนยัน…" })
  ).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("กำลังส่งอีเมลยืนยัน");

  resolveRequest?.({
    ok: true,
    json: async () => ({
      status: "verification_sent",
      maskedEmail: "p****@example.com",
    }),
  } as Response);

  expect(
    await screen.findByText(/ส่งอีเมลยืนยันไปที่ p\*\*\*\*@example.com แล้ว/)
  ).toBeVisible();
  expect(global.fetch).toHaveBeenCalledWith(
    `/api/trials/${TOKEN}/parent-updates`,
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        email: "Parent@Example.com",
        recipientAttested: true,
        consented: true,
      }),
    })
  );
});

test("keeps the form available for retry when delivery fails", async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status: 503,
    json: async () => ({ error: "email_unavailable" }),
  });
  render(<ParentUpdateOptIn token={TOKEN} />);

  fireEvent.change(screen.getByLabelText("อีเมลผู้ปกครอง"), {
    target: { value: "parent@example.com" },
  });
  fireEvent.click(screen.getByLabelText(/ข้าพเจ้าเป็นผู้ปกครอง\/ผู้ดูแล/));
  fireEvent.click(screen.getByLabelText(/ยินยอมรับอีเมลอัปเดต/));
  fireEvent.click(screen.getByRole("button", { name: "ส่งอีเมลยืนยัน" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "ยังส่งอีเมลยืนยันไม่ได้"
  );
  expect(screen.getByRole("button", { name: "ลองส่งอีกครั้ง" })).toBeEnabled();
  expect(screen.getByDisplayValue("parent@example.com")).toBeVisible();
});
