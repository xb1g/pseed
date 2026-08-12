import { redirect } from "next/navigation";

/** Legacy URL — profile essentials now live in /onboard account phase. */
export default function FinishProfileRedirect() {
  redirect("/onboard");
}
