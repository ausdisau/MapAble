/**
 * Public-facing, plain-language transparency notice.
 * This is a product disclosure, not a waiver of legal rights or obligations.
 * Regulatory references last reviewed 17 Nov 2026.
 */
export function RelationalFitDisclosure() {
  return (
    <aside aria-label="How matching and AI work — risks, benefits and rights" className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
      <p className="font-semibold">Important: this is an optional comparison tool.</p>
      <p className="mt-2">
        Relational Fit compares your choices with worker-declared practices. It
        does not administer psychological tests, assess personality, predict
        relationships, verify competence or automatically decide who can work
        with you. Any match is a lead for human review—not a booking, employment
        decision or safety approval.
      </p>
      <details className="mt-3">
        <summary className="min-h-11 cursor-pointer py-3 font-semibold">
          Understand the benefits, risks, privacy and your rights
        </summary>
        <div className="space-y-3 pb-2">
          <section>
            <h4 className="font-semibold">Possible benefits</h4>
            <p>
              Your preferences can be easier to express, compare and correct.
              Clear explanations may reduce repeated questions and help you
              identify practical things to discuss before meeting a worker.
              These benefits have not yet been demonstrated by a MapAble pilot.
            </p>
          </section>
          <section>
            <h4 className="font-semibold">Important risks and limits</h4>
            <p>
              Information may be missing, out of date, overstated or affected
              by bias. Workers may describe practices they cannot consistently
              deliver. A shortlist could overlook someone suitable or suggest
              someone unsuitable. The system must not replace current NDIS
              worker screening, training, reference checks, accessibility
              arrangements, professional judgement or informed participant choice.
            </p>
          </section>
          <section>
            <h4 className="font-semibold">What AI does and does not do</h4>
            <p>
              The wider Support Builder may use a language model to help with
              conversation and drafting, which can be inaccurate. This v1 worker
              comparison uses explainable software rules and does not send your
              selected preferences to a generative AI model. No personality,
              mental-health or behaviour profile is inferred from your text,
              speech, disability or interactions.
            </p>
          </section>
          <section>
            <h4 className="font-semibold">Privacy and data location</h4>
            <p>
              The participant comparison runs for this request and does not
              create a saved participant preference profile in v1. Workers
              choose whether to save voluntary declarations and can withdraw
              them. The preview uses the configured application database; its
              actual deployment and model-processing locations must be checked
              before public use. Please do not enter sensitive health details
              unless you understand the applicable privacy notice and purpose.
            </p>
          </section>
          <section>
            <h4 className="font-semibold">Choice, review and complaints</h4>
            <p>
              You can decline this feature and use the existing Provider Finder
              or human-assisted discovery. A participant controls preferences
              and can choose or decline workers. Workers can opt out without
              an automatic penalty. Either party may ask for human review or
              correction. This tool does not determine eligibility for NDIS
              funding or create legal or clinical advice. Nothing in this
              notice removes statutory rights, employment protections,
              privacy obligations or a provider's duty of care.
            </p>
          </section>
          <section>
            <h4 className="font-semibold">Australian information and safeguards</h4>
            <ul className="list-disc space-y-1 pl-4">
              <li><a className="text-primary underline" href="https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/guidance-on-privacy-and-the-use-of-commercially-available-ai-products" target="_blank" rel="noopener noreferrer">OAIC guidance: privacy and commercial AI</a></li>
              <li><a className="text-primary underline" href="https://www.oaic.gov.au/news/media-centre/new-resources-on-transparency-for-use-of-ai-and-automated-decision-making" target="_blank" rel="noopener noreferrer">OAIC: additional transparency obligations from 10 December 2026, where applicable</a></li>
              <li><a className="text-primary underline" href="https://www.ndiscommission.gov.au/workforce/worker-screening" target="_blank" rel="noopener noreferrer">NDIS Commission: worker screening</a></li>
              <li><a className="text-primary underline" href="https://www.fairwork.gov.au/employment-conditions/protections-at-work/protection-from-discrimination-at-work" target="_blank" rel="noopener noreferrer">Fair Work Ombudsman: discrimination protections</a></li>
              <li><a className="text-primary underline" href="https://humanrights.gov.au/resource-hub/theres-nothing-casual-about-racism/guidetool/step-by-step-guide-to-preventing-discrimination-in-recruitment" target="_blank" rel="noopener noreferrer">Australian Human Rights Commission: job-relevant psychological testing</a></li>
            </ul>
          </section>
          <p className="text-muted-foreground">
            Legal and policy information is general, current only to the
            review date of this preview, and is not a substitute for
            individual legal, occupational, clinical or NDIS advice.
          </p>
        </div>
      </details>
    </aside>
  );
}
