import { redirect } from "next/navigation";

export default function NewWorkerPage() {
  redirect("/provider/workers?invite=1");
}
