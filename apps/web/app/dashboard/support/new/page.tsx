import { redirect } from "next/navigation";

export default function NewSupportRedirectPage() {
  redirect("/dashboard/safety/support/new");
}
