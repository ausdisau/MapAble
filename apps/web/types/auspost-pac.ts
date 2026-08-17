/** Australian state abbreviations accepted by Australia Post PAC APIs. */
export type AusPostState = "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";

export type AusPostPacLocality = {
  location: string;
  state: AusPostState | string;
  postcode: string;
  category?: string;
};

export type AusPostPostcodeSearchResult = {
  localities: AusPostPacLocality[];
};

export type AusPostPacErrorCode =
  | "AUSPOST_PAC_NOT_CONFIGURED"
  | "AUSPOST_PAC_UPSTREAM_ERROR"
  | "AUSPOST_PAC_VALIDATION_ERROR";
