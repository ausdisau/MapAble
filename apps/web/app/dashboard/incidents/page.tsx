import { redirect } from "next/navigation";

export default function IncidentsRedirectPage() {
  redirect("/dashboard/safety/incidents");
}
