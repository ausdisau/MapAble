// @vitest-environment jsdom
import { cleanup,render,screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach,describe,expect,it } from "vitest";

import { NdiswcLookupGuide } from "@/components/workers/NdiswcLookupGuide";

afterEach(cleanup);
describe("Accessible guidance for worker screening",()=>{
  it("has an accessible role selector, state/territory selector and no data capture",()=>{
    render(<NdiswcLookupGuide/>);
    expect(screen.getByRole("combobox",{name:"I am a..."})).toBeTruthy();
    expect(screen.getByRole("combobox",{name:"State or territory for the worker screening unit"})).toBeTruthy();
    expect(screen.getByText(/CURRENT SCREENING STATUS: NOT INDEPENDENTLY VERIFIED/)).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
  it("changes authoritative link by selected state",async()=>{
    const user=userEvent.setup();
    render(<NdiswcLookupGuide/>);
    await user.selectOptions(screen.getByRole("combobox",{name:"I am a..."}),"nsw_worker");
    await user.selectOptions(screen.getByRole("combobox",{name:"State or territory for the worker screening unit"}),"VIC");
    const link=screen.getByRole("link",{name:/Read the Victorian NDIS Check application/});
    expect(link.getAttribute("href")).toBe("https://www.vic.gov.au/ndis-worker-screening-check");
  });
  it("does not treat a selected clearance label as a worker verification",async()=>{
    const user=userEvent.setup();
    render(<NdiswcLookupGuide/>);
    await user.selectOptions(screen.getByRole("combobox",{name:"Term to explain"}),"Clearance");
    expect(screen.getByText(/This is a definition, not an individual check/)).toBeTruthy();
  });
  it("supports a larger-font presentation preference without a remote call",async()=>{
    const user=userEvent.setup();
    render(<NdiswcLookupGuide/>);
    await user.click(screen.getByLabelText("Use larger text"));
    expect(screen.getByRole("heading",{level:1})).toBeTruthy();
  });
});
