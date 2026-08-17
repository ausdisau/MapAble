import { describe, expect, it } from "vitest";

import type { ProviderOutlet } from "@/data/provider-outlets.types";
import { mapProviderOutletToDbRow } from "@/lib/supabase/map-provider-outlet-row";

const sample: ProviderOutlet = {
  ABN: "24660787824",
  Prov_N: "mr Pesty Pest Control Solutions",
  Head_Office: "Smeaton Grange NSW 2567",
  Outletname: "Mobile",
  Flag: "O",
  Active: 1,
  Phone: "02 9554 3123",
  Website: "www.mrpesty.com.au",
  Email: "bookings@mrpesty.com.au",
  Address: "8 Gallipoli Street, Smeaton Grange, NSW 2567",
  State_cd: "NSW",
  Post_cd: 2567,
  Latitude: -34.036569,
  Longitude: 150.762022,
  RegGroup: [8],
  Post_cd_p: "",
  opnhrs: "Monday: 7AM-4PM",
  prfsn: "Other ",
};

describe("mapProviderOutletToDbRow", () => {
  it("maps outlet fields and active flag", () => {
    const row = mapProviderOutletToDbRow(sample, 0);
    expect(row.abn).toBe("24660787824");
    expect(row.name).toContain("Pesty");
    expect(row.active).toBe(true);
    expect(row.state).toBe("NSW");
    expect(row.reg_group).toEqual([8]);
    expect(row.raw).toMatchObject({ ABN: sample.ABN });
  });
});
