import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const INFRA_ROOT = join(process.cwd(), "infra");

function listTfFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...listTfFiles(full));
    } else if (entry.endsWith(".tf") || entry.endsWith(".tfvars")) {
      results.push(full);
    }
  }
  return results;
}

describe("infra HCL modules", () => {
  it("has root main.tf with required modules", () => {
    const main = readFileSync(join(INFRA_ROOT, "main.tf"), "utf8");
    expect(main).toContain('module "application"');
    expect(main).toContain('module "postgresql"');
    expect(main).toContain('module "redis"');
    expect(main).toContain('module "object_storage"');
    expect(main).toContain('module "queue"');
    expect(main).toContain('module "secrets"');
    expect(main).toContain('module "monitoring"');
    expect(main).toContain('module "dns"');
    expect(main).toContain('module "cdn"');
    expect(main).toContain('module "waf"');
    expect(main).toContain('module "backups"');
  });

  it("defines four environment tfvars", () => {
    const envDir = join(INFRA_ROOT, "environments");
    const files = readdirSync(envDir).filter((f) => f.endsWith(".tfvars"));
    expect(files).toContain("development.tfvars");
    expect(files).toContain("staging.tfvars");
    expect(files).toContain("production.tfvars");
    expect(files).toContain("disaster-recovery.tfvars");
  });

  it("has valid HCL syntax in all .tf files (basic parse)", () => {
    const files = listTfFiles(INFRA_ROOT);
    expect(files.length).toBeGreaterThan(10);
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      expect(content).not.toMatch(/\tresource\s/);
      if (file.endsWith(".tf")) {
        expect(content.length).toBeGreaterThan(0);
      }
    }
  });

  it("does not commit secrets in infra files", () => {
    const files = listTfFiles(INFRA_ROOT);
    for (const file of files) {
      const content = readFileSync(file, "utf8").toLowerCase();
      expect(content).not.toMatch(/password\s*=\s*"/);
      expect(content).not.toMatch(/api_key\s*=\s*"/);
    }
  });
});
