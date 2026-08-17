import { OrganisationForm } from "@/components/forms/OrganisationForm";

export const metadata = { title: "New organisation | Admin" };

export default function NewOrganisationPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">New organisation</h1>
      <OrganisationForm />
    </div>
  );
}
