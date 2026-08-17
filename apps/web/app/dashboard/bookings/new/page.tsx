import { BookingWizard } from "@/components/bookings/BookingWizard";

export const metadata = { title: "New booking | MapAble Core" };

export default function NewBookingPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">New booking request</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Follow each step. After you submit, a coordinator will review your
          request. You can change consent at any time from the consent page.
        </p>
      </header>
      <BookingWizard />
    </div>
  );
}
