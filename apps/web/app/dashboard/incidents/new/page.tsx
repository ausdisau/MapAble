import { redirect } from "next/navigation";

export default function NewIncidentRedirectPage() {
  redirect("/dashboard/safety/incidents/new");
}
