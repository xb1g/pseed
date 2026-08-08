import { redirect } from "next/navigation";

/** Legacy / App Store link alias — canonical page is /terms */
export default function TosRedirectPage() {
  redirect("/terms");
}
