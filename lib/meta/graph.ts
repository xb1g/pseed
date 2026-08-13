import crypto from "crypto";
import type { DmPlatform } from "@/types/dm-leads";

const GRAPH_API_VERSION = "v21.0";

/**
 * Verifies Meta's X-Hub-Signature-256 header against the raw request body.
 * Meta signs webhook payloads with the app secret so we can trust the sender.
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    throw new Error("META_APP_SECRET is not set");
  }

  const [algo, receivedSig] = signatureHeader.split("=");
  if (algo !== "sha256" || !receivedSig) return false;

  const expectedSig = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const receivedBuf = Buffer.from(receivedSig, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (receivedBuf.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(receivedBuf, expectedBuf);
}

/**
 * Sends a text message to a lead via the Messenger Platform Send API.
 * Same endpoint shape for both Facebook Page and Instagram threads.
 */
export async function sendMetaMessage(
  platform: DmPlatform,
  recipientPsid: string,
  text: string
): Promise<void> {
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("META_PAGE_ACCESS_TOKEN is not set");
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientPsid },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Meta Send API failed for ${platform} (${res.status}): ${errBody}`);
  }
}
