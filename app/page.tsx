import { redirect } from "next/navigation";

export default function Home() {
  // The weekly view IS the app — no landing page, no login wall in v1.
  redirect("/weekly");
}
