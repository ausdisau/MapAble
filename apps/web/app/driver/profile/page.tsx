import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function DriverProfilePage() {
  const user = await requirePermission("transport:drive");
  const profile = await prisma.driverProfile.findFirst({
    where: { userId: user.id },
    include: { organisation: { select: { name: true } } },
  });

  return (
    <div className="space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">Driver profile</h1>
      {profile ? (
        <dl className="space-y-2 text-lg">
          <div>
            <dt className="font-medium">Operator</dt>
            <dd>{profile.organisation?.name}</dd>
          </div>
          <div>
            <dt className="font-medium">Verification</dt>
            <dd>{profile.verificationStatus}</dd>
          </div>
        </dl>
      ) : (
        <p>No driver profile linked yet.</p>
      )}
    </div>
  );
}
