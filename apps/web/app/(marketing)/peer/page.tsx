import { PublicModulePage } from "@/components/marketing/PublicModulePage";

export const metadata = {
  title: "MapAble Peer | Lived-experience community",
  description:
    "Learn how MapAble Peer will support moderated lived-experience circles without popularity feeds or unmoderated direct messages.",
};

export default function PeerPage() {
  return (
    <PublicModulePage
      eyebrow="MapAble Peer"
      title="Lived-experience support without turning disability support into social media."
      description="MapAble Peer is planned for moderated topic circles, peer mentor profiles, story resources and escalation pathways when safety concerns appear."
      whoFor={[
        "Participants looking for lived-experience perspectives.",
        "Peer mentors and community moderators.",
        "Families and supporters seeking safe, moderated resources.",
      ]}
      availableNow={[
        "Public explanation of the peer support safety model.",
        "Pilot enquiry pathway for peer community design.",
        "Existing PEERS community links where enabled.",
      ]}
      comingSoon={[
        "Peer profiles with privacy settings.",
        "Topic circles, lived-experience Q&A and story libraries.",
        "Moderation tooling and safety escalation.",
      ]}
      safetyNote="Peer advice will be framed as lived experience, not professional advice. MapAble Peer will avoid followers, likes, popularity feeds and unmoderated direct messages."
      primaryCta={{ label: "Join pilot", href: "/contact" }}
      secondaryCta={{ label: "Contact MapAble", href: "/contact" }}
    />
  );
}
