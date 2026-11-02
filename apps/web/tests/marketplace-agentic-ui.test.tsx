// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { AgenticMarketplaceLab } from "@/components/marketplace/AgenticMarketplaceLab";

afterEach(() => cleanup());

describe("agentic marketplace keyboard and screen-reader DOM preflight", () => {
  it("has named participant actions and announces an understandable status", () => {
    render(<AgenticMarketplaceLab />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Example support need" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Prepare local request" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Withdraw local permission" })).toBeTruthy();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });
  it("supports independent button-driven comparison, shortlisting and withdrawal", async () => {
    const user = userEvent.setup();
    render(<AgenticMarketplaceLab />);
    await user.click(screen.getByRole("button", { name: "Prepare local request" }));
    await user.click(screen.getByRole("button", { name: "Allow fictional provider previews" }));
    await user.click(screen.getByRole("button", { name: "Simulate all provider replies" }));
    await user.click(screen.getByRole("button", { name: "Review complete comparison" }));
    const shortlist = screen.getAllByRole("button", { name: /Shortlist fictional offer from/ });
    expect(shortlist).toHaveLength(3);
    await user.click(shortlist[1]);
    expect(screen.getByText(/Current stage: Example shortlisted for human review only/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Allow fictional worker preview" }));
    await user.click(screen.getByRole("button", { name: "Withdraw local permission" }));
    expect(screen.getByText(/Current stage: All local sharing permissions withdrawn/)).toBeTruthy();
    expect(screen.queryAllByRole("button", { name: /Shortlist fictional offer from/ })).toHaveLength(0);
  });
  it("supports keyboard-only preparation without pointer interactions", async () => {
    const user = userEvent.setup();
    render(<AgenticMarketplaceLab />);
    const scenario = screen.getByRole("combobox", { name: "Example support need" });
    scenario.focus();
    await user.tab();
    expect(document.activeElement?.getAttribute("type")).toBe("checkbox");
    await user.tab();
    const prepare = screen.getByRole("button", { name: "Prepare local request" });
    expect(document.activeElement).toBe(prepare);
    await user.keyboard("{Enter}");
    expect(screen.getByText(/Current stage: Prepared locally/)).toBeTruthy();
  });
  it("provides an explicit non-AI and non-transactional boundary", () => {
    render(<AgenticMarketplaceLab />);
    const heading = screen.getByRole("heading", { name: "5. Inspect the agent tool boundary" });
    const section = heading.closest("section");
    expect(section).toBeTruthy();
    expect(within(section as HTMLElement).getByText(/not real remote tools/)).toBeTruthy();
    expect(screen.getByText(/cannot arrange or dispatch services/)).toBeTruthy();
  });
});
