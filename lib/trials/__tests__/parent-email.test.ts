import {
  buildParentUpdateEmail,
  buildVerificationEmail,
  createParentEmailTransport,
} from "../parent-email";

test("verification email contains verification and unsubscribe controls", () => {
  const email = buildVerificationEmail({
    seedTitle: "AI Builder",
    verificationUrl: "https://passionseed.org/verify/token",
    unsubscribeUrl: "https://passionseed.org/unsubscribe/token",
  });
  expect(email.subject).toContain("ยืนยัน");
  expect(email.html).toContain("https://passionseed.org/verify/token");
  expect(email.html).toContain("https://passionseed.org/unsubscribe/token");
});

test("progress email only renders safe event metadata", () => {
  const email = buildParentUpdateEmail({
    eventKinds: ["milestone_completed"],
    payloads: [{ seedTitle: "AI Builder", currentDay: 2 }],
    unsubscribeUrl: "https://passionseed.org/unsubscribe/token",
  });
  expect(email.subject).toContain("AI Builder");
  expect(email.html).toContain("วันที่ 2");
  expect(email.html).not.toContain("reflection");
  expect(email.html).not.toContain("answer");
  expect(email.html).not.toContain("chat");
});

test("transport fails gracefully when Resend is not configured", async () => {
  const transport = createParentEmailTransport({ apiKey: undefined, fromEmail: undefined });
  await expect(transport.send({
    to: "parent@example.com",
    subject: "Hello",
    html: "<p>Hello</p>",
  })).resolves.toEqual({ ok: false, transient: true, code: "email_unavailable" });
});

test("provider details are reduced to non-sensitive delivery codes", async () => {
  const send = jest.fn().mockResolvedValue({ error: { statusCode: 422, message: "private provider detail" } });
  const transport = createParentEmailTransport({
    apiKey: "test-only",
    fromEmail: "hi@example.com",
    providerSend: send,
  });
  await expect(transport.send({
    to: "parent@example.com", subject: "Hello", html: "<p>Hello</p>",
  })).resolves.toEqual({ ok: false, transient: false, code: "provider_rejected" });
});

test("transport forwards the delivery idempotency key to Resend request options", async () => {
  const providerSend = jest.fn().mockResolvedValue({ error: null });
  const transport = createParentEmailTransport({
    apiKey: "test-only",
    fromEmail: "hi@example.com",
    providerSend,
  });

  await transport.send({
    to: "parent@example.com",
    subject: "Hello",
    html: "<p>Hello</p>",
    idempotencyKey: "parent-update/abc123",
  });

  expect(providerSend).toHaveBeenCalledWith(
    expect.objectContaining({ to: "parent@example.com" }),
    { idempotencyKey: "parent-update/abc123" }
  );
  expect(providerSend.mock.calls[0][0]).not.toHaveProperty("idempotencyKey");
});
