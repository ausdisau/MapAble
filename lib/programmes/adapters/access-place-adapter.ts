/**
 * Programme place writes must target AccessPlace only.
 * AccessiblePlace is legacy and must not receive new programme creates.
 */

export type ProgrammePlaceWriteTarget = "AccessPlace";

export type ProgrammePlaceAdapter = {
  readonly writeTarget: ProgrammePlaceWriteTarget;
  readonly forbidsAccessiblePlaceWrites: true;
  readonly isMock: boolean;
  assertCanCreatePlaceRecord(modelName: string): void;
};

class AccessPlaceProgrammeAdapter implements ProgrammePlaceAdapter {
  readonly writeTarget = "AccessPlace" as const;
  readonly forbidsAccessiblePlaceWrites = true as const;
  readonly isMock = false;

  assertCanCreatePlaceRecord(modelName: string): void {
    if (modelName === "AccessiblePlace") {
      throw new Error(
        "Programme services must not create AccessiblePlace records; use AccessPlace",
      );
    }
    if (modelName !== "AccessPlace") {
      throw new Error(
        `Programme place writes must target AccessPlace, not ${modelName}`,
      );
    }
  }
}

let adapter: ProgrammePlaceAdapter = new AccessPlaceProgrammeAdapter();

export function getProgrammePlaceAdapter(): ProgrammePlaceAdapter {
  return adapter;
}

/** Test helper — restore production adapter after overrides. */
export function __setProgrammePlaceAdapterForTests(
  next: ProgrammePlaceAdapter | null,
): void {
  adapter = next ?? new AccessPlaceProgrammeAdapter();
}
