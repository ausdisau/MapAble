import { redirect } from "next/navigation";

export const metadata = {
  title: "Enterprise provider console | MapAble",
};

/** Folded into the provider control panel at `/provider`. */
export default function EnterpriseProviderPage() {
  redirect("/provider#enterprise-workspace");
}
