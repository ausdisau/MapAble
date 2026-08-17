import { redirect } from "next/navigation";

export default function DashboardCareNewRedirect() {
  redirect("/care/request");
}
