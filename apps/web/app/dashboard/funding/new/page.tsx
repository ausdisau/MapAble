import { redirect } from "next/navigation";

export default function FundingNewRedirectPage() {
  redirect("/dashboard/billing/funding/new");
}
