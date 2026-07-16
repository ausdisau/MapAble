import type { AccessNeed } from "@/lib/access-fit/types";

/** Extended functional preferences for indoor floor-plan fit (no diagnosis fields). */
export type IndoorAccessPreferences = AccessNeed & {
  changingPlacesRequired?: boolean;
  quietSpaceRequired?: boolean;
  minimumDoorwayWidthMm?: number;
  minimumCorridorWidthMm?: number;
  maximumThresholdHeightMm?: number;
  liftRequired?: boolean;
  avoidStairs?: boolean;
  avoidEscalators?: boolean;
};

export const DEFAULT_INDOOR_PREFERENCES: IndoorAccessPreferences = {
  wheelchairUser: false,
  powerchairUser: false,
  stepFreeRequired: false,
  accessibleToiletRequired: false,
  lowSensoryNeeded: false,
  hearingLoopNeeded: false,
  AuslanNeeded: false,
  AACFriendlyNeeded: false,
  assistanceAnimal: false,
  accessibleParkingNeeded: false,
  dropOffNeeded: false,
  transportSupportNeeded: false,
  fatigueBufferNeeded: false,
  changingPlacesRequired: false,
  quietSpaceRequired: false,
};
