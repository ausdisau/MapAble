export type EligibilityCheckResult = {
  eligible: boolean;
  reasons: string[];
};

export type ScheduleConflictResult = {
  hasConflict: boolean;
  conflicts: Array<{
    id?: string;
    conflictType: string;
    details: string;
  }>;
};

export type DispatchAssignmentInput = {
  tripId: string;
  organisationId: string;
  driverId: string;
  vehicleId: string;
  assignedByUserId: string;
};

export type DriverAvailabilityWindow = {
  startAt: Date;
  endAt: Date;
  available: boolean;
};
