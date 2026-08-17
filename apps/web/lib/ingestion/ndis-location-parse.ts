/** Address parsing for NDIS static JSON (shared with provider finder). */

export type NdisLocationParts = {
  suburb: string;
  state: string;
  postcode: string;
};

export function parseAddressFromNdisRecord(
  address: string,
): NdisLocationParts | null {
  const raw = address.trim();
  if (!raw || raw.toUpperCase() === "CONFIDENTIAL") return null;

  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const last = parts[parts.length - 1] ?? "";
    const lastParts = last.split(/\s+/).filter(Boolean);
    const postcode = lastParts[lastParts.length - 1] ?? "";
    const state = lastParts[lastParts.length - 2] ?? "";
    const suburb = parts[parts.length - 2] ?? "";
    return { suburb, state, postcode };
  }

  if (parts.length === 1) {
    const tokens = parts[0].split(/\s+/).filter(Boolean);
    if (tokens.length >= 3) {
      return {
        postcode: tokens[tokens.length - 1] ?? "",
        state: tokens[tokens.length - 2] ?? "",
        suburb: tokens.slice(0, -2).join(" "),
      };
    }
    if (tokens.length === 2) {
      return {
        suburb: tokens[0] ?? "",
        state: tokens[1] ?? "",
        postcode: "",
      };
    }
    return { suburb: parts[0], state: "", postcode: "" };
  }

  return null;
}

export function parseHeadOfficeLocation(headOffice: string): NdisLocationParts {
  const parts = headOffice.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 3) {
    return {
      postcode: parts[parts.length - 1] ?? "",
      state: parts[parts.length - 2] ?? "",
      suburb: parts.slice(0, -2).join(" "),
    };
  }
  if (parts.length === 2) {
    return { suburb: parts[0] ?? "", state: parts[1] ?? "", postcode: "" };
  }
  return { suburb: headOffice, state: "", postcode: "" };
}
