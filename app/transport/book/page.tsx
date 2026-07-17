import { redirect } from "next/navigation";

/** Compatibility alias for the participant request flow. */
export default function TransportBookCompatibilityPage() {
  redirect("/transport/request");
}
