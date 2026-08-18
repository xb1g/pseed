import { isPortRequest } from "@/lib/meta/comment-intent";

describe("isPortRequest", () => {
  it.each(["port", "Port", "PORT", "portfolio", "ขอ port ครับ", "พอร์ต", "พอร์ท", "port ค่ะ", "อยากได้พอร์ตค่ะ"])(
    "treats %p as an opt-in",
    (text) => expect(isPortRequest(text)).toBe(true)
  );

  it.each(["support", "important", "airport", "Supporting you", "🔥🔥", "สวยมาก", "@friend ดูนี่", "", null, undefined])(
    "treats %p as not an opt-in",
    (text) => expect(isPortRequest(text as string | null | undefined)).toBe(false)
  );
});
