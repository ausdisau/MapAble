import { redirect } from "next/navigation";

export default function FundingRedirectPage() {
  redirect("/dashboard/billing/funding");
}
