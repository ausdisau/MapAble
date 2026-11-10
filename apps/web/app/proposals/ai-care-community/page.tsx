import type { Metadata } from "next";

import {
  contextLinks,
  firstPilot,
  foundingPrinciples,
  proposal,
  researchThemes,
  stages,
  stakeholders,
} from "@/lib/proposals/ai-care-community-content";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Accessible Futures | AI & Care Community of Practice — Concept Proposal",
  description:
    "A proposal from Australian Disability Ltd to connect people with disability, care workers, providers, researchers, businesses and public institutions around responsible AI in the care economy.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Accessible Futures — AI-Enabled Care & Support Community of Practice",
    description:
      "Concept proposal only. An invitation to explore disability-led research and collaboration across the care economy.",
    type: "website",
  },
};

const inPageLinks = [
  { label: "The case", href: "#the-case" },
  { label: "The network", href: "#the-network" },
  { label: "Research", href: "#research" },
  { label: "Approach", href: "#approach" },
  { label: "Invitation", href: "#invitation" },
] as const;

const contactHref =
  "mailto:" +
  proposal.contactAddress +
  "?subject=" +
  encodeURIComponent(proposal.contactSubject);

export default function AiCareCommunityProposalPage() {
  return (
    <>
      <a className={styles.skipLink} href="#proposal-content">
        Skip to proposal
      </a>
      <div className={styles.site}>
        <div className={styles.statusStrip} role="note" aria-label="Proposal status">
          <span className={styles.statusDot} aria-hidden="true" />
          {proposal.statusLabel}. No formal partnership, pilot or membership programme is announced.
        </div>

        <header className={styles.siteHeader}>
          <div className={styles.headerInner}>
            <a
              href="https://www.ausdis.com.au/"
              className={styles.brand}
              aria-label="Australian Disability Ltd, opens organisation website"
            >
              <span className={styles.brandSymbol} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className={styles.brandText}>
                <strong>AUSTRALIAN DISABILITY</strong>
                <small>Accessible Futures / MapAble concept</small>
              </span>
            </a>

            <nav className={styles.nav} aria-label="Proposal sections">
              {inPageLinks.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <main id="proposal-content">
          <section className={styles.hero} aria-labelledby="hero-heading">
            <div className={styles.heroInner}>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>{proposal.heroEyebrow}</p>
                <h1 id="hero-heading">{proposal.heroTitle}</h1>
                <p className={styles.heroLead}>{proposal.heroDescription}</p>
                <div className={styles.heroActions}>
                  <a className={styles.buttonPrimary} href="#the-network">
                    Explore the proposal <span aria-hidden="true">↗</span>
                  </a>
                  <a className={styles.buttonGhost} href="#invitation">
                    Discuss collaboration <span aria-hidden="true">→</span>
                  </a>
                </div>
                <p className={styles.heroFootnote}>
                  <strong>{proposal.fullName}</strong> · A proposed initiative by{" "}
                  {proposal.organisation}, using {proposal.platform} as a potential research
                  demonstrator.
                </p>
              </div>

              <div className={styles.heroVisual} aria-hidden="true">
                <div className={styles.visualTopline}>
                  <span>CARE &amp; INTELLIGENCE</span>
                  <span>RESEARCH CONCEPT / 01</span>
                </div>
                <svg viewBox="0 0 500 475" className={styles.orbitGraphic} focusable="false">
                  <circle cx="250" cy="235" r="174" fill="none" stroke="#bed8d0" strokeWidth="1.2" strokeDasharray="3 9" />
                  <circle cx="250" cy="235" r="117" fill="none" stroke="#bed8d0" strokeWidth="1.5" />
                  <g stroke="#bdd8d0" strokeWidth="1.5" fill="none">
                    <path d="M250 118 L250 45" />
                    <path d="M145 182 L90 126" />
                    <path d="M356 182 L412 126" />
                    <path d="M140 288 L88 343" />
                    <path d="M359 287 L413 343" />
                    <path d="M250 352 L250 426" />
                  </g>
                  <circle cx="250" cy="235" r="91" fill="#f5fff8" stroke="#83a99c" strokeWidth="2.4" />
                  <text x="250" y="223" textAnchor="middle" fontSize="15" fontWeight="700" fill="#153a31">PEOPLE FIRST</text>
                  <text x="250" y="245" textAnchor="middle" fontSize="11.5" fill="#315f54">Choice · Rights</text>
                  <text x="250" y="264" textAnchor="middle" fontSize="11.5" fill="#315f54">Communication</text>
                  {[
                    { x:250,y:45,t:"WORKERS" },
                    { x:88,y:125,t:"PROVIDERS" },
                    { x:412,y:125,t:"RESEARCH" },
                    { x:88,y:343,t:"BUSINESS" },
                    { x:412,y:343,t:"PUBLIC SECTOR" },
                    { x:250,y:426,t:"COMMUNITY" }
                  ].map((n) => (
                    <g key={n.t}>
                      <rect x={n.x-56} y={n.y-18} width="112" height="36" rx="18" fill="#0b3f37" />
                      <text x={n.x} y={n.y+4} fontSize="10.5" fontWeight="700" textAnchor="middle" letterSpacing=".5" fill="#ffffff">{n.t}</text>
                    </g>
                  ))}
                </svg>
                <p className={styles.visualCaption}>A network organised around the people affected by its decisions.</p>
              </div>
            </div>
          </section>

          <section className={styles.intro} id="the-case" aria-labelledby="case-heading">
            <div className={styles.sectionGrid}>
              <div>
                <p className={styles.kicker}>01 / Why this matters</p>
                <h2 id="case-heading">The care economy is a system of relationships—not a collection of transactions.</h2>
              </div>
              <div className={styles.bodyCopy}>
                <p>
                  When a worker cancels, a journey becomes inaccessible or a person cannot
                  communicate in the way a service expects, the consequence is not merely
                  administrative. It can mean a missed appointment, an interrupted day,
                  a lost opportunity or a broken relationship of trust.
                </p>
                <p>
                  Technology could help. But the measure of its success must be whether
                  people have more choice, more reliable support and greater control—not
                  simply whether systems process requests faster.
                </p>
                <div className={styles.quoteBand}>
                  <span className={styles.quoteMark} aria-hidden="true">“</span>
                  <p>{proposal.mission}</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.networkSection} id="the-network" aria-labelledby="network-heading">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.kicker}>02 / The network</p>
                <h2 id="network-heading">Different expertise. Shared responsibility.</h2>
              </div>
              <p>
                The proposed Community of Practice would bring six perspectives into the
                same conversation, with disabled people and workers contributing to its
                governance and research priorities.
              </p>
            </div>
            <ul className={styles.stakeholderGrid}>
              {stakeholders.map((group, index) => (
                <li key={group.id} className={styles.stakeholderCard}>
                  <span className={styles.cardIndex} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{group.title}</h3>
                  <p>{group.contribution}</p>
                </li>
              ))}
            </ul>
            <div className={styles.proposalCaveat} role="note">
              <strong>Collaboration is being proposed, not represented as agreed.</strong>{" "}
              This is an invitation to discuss participation. No organisation is listed here
              as a confirmed founding member or research partner.
            </div>
          </section>

          <section className={styles.researchSection} id="research" aria-labelledby="research-heading">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.kicker}>03 / The research agenda</p>
                <h2 id="research-heading">Four questions worth answering together.</h2>
              </div>
              <p>
                A research agenda that combines practical care coordination, accessible AI,
                workforce conditions and independent rights-based evaluation.
              </p>
            </div>
            <div className={styles.researchGrid}>
              {researchThemes.map((theme) => (
                <article className={styles.researchCard} key={theme.number}>
                  <span className={styles.themeNumber}>{theme.number}</span>
                  <h3>{theme.title}</h3>
                  <p>{theme.description}</p>
                  <p className={styles.measure}><strong>Explore:</strong> {theme.measure}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.pilotSection} aria-labelledby="pilot-heading">
            <div className={styles.pilotNumber} aria-hidden="true">01<span>/ PILOT IDEA</span></div>
            <div className={styles.pilotContent}>
              <p className={styles.kicker}>{firstPilot.eyebrow}</p>
              <h2 id="pilot-heading">{firstPilot.title}</h2>
              <p className={styles.pilotLead}>{firstPilot.description}</p>
              <div className={styles.pilotColumns}>
                <div><h3>Start small</h3><p>{firstPilot.scope}</p></div>
                <div><h3>Know the boundary</h3><p>{firstPilot.nonGoals}</p></div>
              </div>
            </div>
          </section>

          <section className={styles.approachSection} id="approach" aria-labelledby="approach-heading">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.kicker}>04 / How we would proceed</p>
                <h2 id="approach-heading">Built by invitation, tested through evidence.</h2>
              </div>
              <p>
                The next step is a scoping conversation—not recruitment, data collection
                or a predetermined technology deployment.
              </p>
            </div>
            <ol className={styles.steps}>
              {stages.map((stage, index) => (
                <li key={stage.step}>
                  <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{stage.step}</h3><strong>{stage.label}</strong><p>{stage.description}</p></div>
                </li>
              ))}
            </ol>
            <div className={styles.principles}>
              <div className={styles.principlesTitle}>
                <p className={styles.kicker}>Non-negotiable foundations</p>
                <h3>Research with people, never merely about them.</h3>
              </div>
              <ul>
                {foundingPrinciples.map((principle) => (
                  <li key={principle}>
                    <span className={styles.checkMark} aria-hidden="true">↗</span>
                    {principle}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={styles.contextSection} aria-labelledby="context-heading">
            <p className={styles.kicker}>05 / Context and transparency</p>
            <h2 id="context-heading">Our starting points are public. Our partnerships are not presumed.</h2>
            <p className={styles.contextIntro}>
              This concept draws on Australian Disability Ltd&apos;s mission and public
              research priorities for the care economy. Links below provide background;
              they do not imply endorsement or institutional involvement.
            </p>
            <ul className={styles.contextLinks}>
              {contextLinks.map((link) => (
                <li key={link.href}>
                  <span>{link.role}</span>
                  <h3>{link.title}</h3>
                  <p>{link.description}</p>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    Read source <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.invitationSection} id="invitation" aria-labelledby="invitation-heading">
            <div className={styles.invitationInner}>
              <p className={styles.kicker}>An invitation to a conversation</p>
              <h2 id="invitation-heading">If care matters to you, help shape the questions we ask.</h2>
              <p>
                We welcome conversations with people with disability, care workers, providers,
                researchers, technologists and public-sector teams interested in a
                disability-led research Community of Practice. No commitment or membership
                is implied by making an enquiry.
              </p>
              <a className={styles.buttonLight} href={contactHref}>
                Email Australian Disability <span aria-hidden="true">↗</span>
              </a>
              <p className={styles.contactNote}>
                Opens your email application. This page does not accept applications,
                collect research information or submit participant records.
              </p>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div>
              <strong>Australian Disability Ltd</strong>
              <p>{proposal.fullName} · {proposal.lastReviewed}</p>
            </div>
            <div>
              <p>{proposal.partnershipDisclaimer}</p>
              <p>{proposal.pilotDisclaimer}</p>
              <p>
                Status: {proposal.stage.replaceAll("_", " ")}. Public enquiry only; no live
                collaboration directory or platform workflows.
              </p>
            </div>
            <a href="https://www.ausdis.com.au/" target="_blank" rel="noopener noreferrer">
              Australian Disability website ↗
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
