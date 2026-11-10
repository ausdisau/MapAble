import { describe, expect, it } from "vitest";

import {
  contextLinks,
  firstPilot,
  foundingPrinciples,
  proposal,
  proposalOnlyCapabilities,
  researchThemes,
  stages,
  stakeholders
} from "@/lib/proposals/ai-care-community-content";

describe("AI-Enabled Care & Support Community of Practice microsite", () => {
  it("is unequivocally a proposal and not a launched partnership", () => {
    expect(proposal.stage).toBe("concept_proposal");
    expect(proposal.statusLabel.toLowerCase()).toContain("proposal");
    expect(proposal.partnershipDisclaimer).toContain("not yet established");
    expect(proposal.partnershipDisclaimer).toContain("not");
    expect(proposal.pilotDisclaimer).toContain("No pilot");
    expect(proposal.heroDescription.toLowerCase()).toContain("a proposal");
  });

  it("presents six key sectors without inventing organisations that have joined", () => {
    expect(stakeholders).toHaveLength(6);
    expect(new Set(stakeholders.map((sector) => sector.id)).size).toBe(6);
    expect(stakeholders.map((sector) => sector.id)).toContain("participants");
    expect(stakeholders.map((sector) => sector.id)).toContain("workforce");
    expect(stakeholders.every((sector) => sector.contribution.length > 20)).toBe(true);
    expect(stakeholders.some((sector) => /confirmed partner|founding member|joined us/i.test(sector.contribution))).toBe(false);
  });

  it("keeps research agendas investigatory, not established outcomes", () => {
    expect(researchThemes).toHaveLength(4);
    expect(researchThemes.every((theme) => theme.measure.length > 30)).toBe(true);
    expect(firstPilot.eyebrow.toLowerCase()).toContain("possible");
    expect(firstPilot.scope).toContain("synthetic scenarios");
    expect(firstPilot.nonGoals).toContain("No automatic replacement booking");
  });

  it("explicitly protects autonomy, workers, AAC and consent", () => {
    const principles = foundingPrinciples.join(" ").toLowerCase();
    expect(principles).toContain("people with disability");
    expect(principles).toContain("workers");
    expect(principles).toContain("aac");
    expect(principles).toContain("consent");
    expect(principles).toContain("non-ai");
    expect(principles).toContain("no model");
  });

  it("uses invitation rather than a working membership or data intake", () => {
    expect(stages.map((stage) => stage.step)).toEqual([
      "Listen", "Co-design", "Evaluate", "Decide"
    ]);
    expect(proposalOnlyCapabilities.publicPage).toBe(true);
    expect(proposalOnlyCapabilities.inquiryViaExternalEmail).toBe(true);
    expect(proposalOnlyCapabilities.membershipApplication).toBe(false);
    expect(proposalOnlyCapabilities.partnerDirectory).toBe(false);
    expect(proposalOnlyCapabilities.participantDataCollection).toBe(false);
    expect(proposalOnlyCapabilities.researchRecruitment).toBe(false);
    expect(proposalOnlyCapabilities.automatedActions).toBe(false);
    expect(proposalOnlyCapabilities.liveDataSharing).toBe(false);
    expect(proposalOnlyCapabilities.deployedPilot).toBe(false);
  });

  it("shows verified public research context as sources, not affiliations", () => {
    expect(contextLinks.map((link) => link.href)).toEqual([
      "https://www.ausdis.com.au/about",
      "https://www.careeconomycrc.com.au/",
      "https://mapable.com.au/"
    ]);
    expect(contextLinks.find((link) => link.title === "Care Economy CRC")?.description).toContain("not a claimed partnership");
    expect(proposal.contactAddress).toBe("info@ausdis.au");
    expect(proposal.contactSubject).toContain("proposal");
  });
});
