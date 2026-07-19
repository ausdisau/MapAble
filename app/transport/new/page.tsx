import { redirect } from "next/navigation";

/** Canonical book-trip flow for the transport module pack path. */
export default function TransportBookRedirectPage() {
  redirect("/transport/request");
}
