# Agent Skills: AD.iD development

The supplied https://agentskills.io/home.md describes the Agent Skills standard. Follow the public specification and `SKILL.md`-based scoped instructions rather than copying unknown tool prompts or secrets.

Read https://clerk.com/docs/guides/ai/skills.md during environment setup to discover Clerk's published agent development workflow and pin reviewed versions of auth examples. The Markdown URL could not be directly fetched by this chat's web reader; validate its contents in the development environment before treating it as verified instructions.

Never allow a coding agent to rotate production keys, create production Clerk accounts, apply AD.iD migrations, alter Wix member data, automatically grant administrator roles, change DNS, or deploy without an explicit gated approval. Inspect `apps/web/app/api/auth/[...nextauth]/authOptions.ts` before modifying the existing MapAble session path.

Separate an Agent Skill (developer instructions) from MCP (an OAuth-authorized tool protocol). Neither an Agent Skill nor an MCP tool is a replacement for tested authentication and authorisation code.
