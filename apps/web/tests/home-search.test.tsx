/**
 * @vitest-environment jsdom
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeSearch } from "@/components/home/HomeSearch";
import { SearchTrustRow } from "@/components/search/SearchTrustRow";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
});

describe("HomeSearch", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          groups: {
            providers: [],
            services: [],
            locations: [],
            accessibilityFeatures: [],
            languages: [],
            popularSearches: [],
          },
        }),
      })) as unknown as typeof fetch,
    );
  });

  it("renders simplified search hierarchy", () => {
    render(<HomeSearch />);
    expect(screen.getByLabelText("Search for support")).toBeTruthy();
    expect(screen.getByLabelText("Location")).toBeTruthy();
    expect(screen.getByLabelText("Access needs")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /find matching providers/i }),
    ).toBeTruthy();
  });

  it("populates primary search when a chip is selected", () => {
    render(<HomeSearch />);
    fireEvent.click(
      screen.getByRole("button", {
        name: /use suggested search: support worker near st ives/i,
      }),
    );
    const primary = screen.getByLabelText(
      "Search for support",
    ) as HTMLInputElement;
    expect(primary.value).toContain("Support worker near St Ives");
  });

  it("submits expected query parameters to provider finder", async () => {
    render(<HomeSearch />);
    fireEvent.change(screen.getByLabelText("Search for support"), {
      target: { value: "occupational therapy" },
    });
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Parramatta" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /find matching providers/i }),
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/provider-finder?"),
      ),
    );
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).toMatch(/q=occupational/);
    expect(url).toMatch(/location=Parramatta/);
  });
});

describe("SearchTrustRow", () => {
  it("lists trust items with text labels", () => {
    render(<SearchTrustRow />);
    const list = screen.getByRole("list", {
      name: /how mapable search works/i,
    });
    expect(within(list).getByText(/accessibility-first search/i)).toBeTruthy();
    expect(within(list).getByText(/ndis-aware filters/i)).toBeTruthy();
  });
});
