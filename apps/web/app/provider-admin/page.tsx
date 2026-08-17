import { redirect } from "next/navigation";

import { getSessionUserId } from "@/app/utils/provider-admin";

export const metadata = {
  title: "Provider admin",
};

/** Legacy directory admin — folded into the care-platform control panel. */
export default async function ProviderAdminHomePage() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login?callbackUrl=/provider");
  }
  redirect("/provider");
}
