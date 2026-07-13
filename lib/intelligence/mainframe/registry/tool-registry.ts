import { z } from "zod";

export type SyntheticTool<TInput, TOutput> = {
  name: string;
  risk: "read";
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  execute: (input: TInput) => TOutput;
};

export class SyntheticToolRegistry {
  private readonly tools = new Map<string, SyntheticTool<unknown, unknown>>();

  register<TInput, TOutput>(tool: SyntheticTool<TInput, TOutput>): void {
    if (tool.risk !== "read") throw new Error("SYNTHETIC_READ_ONLY_REQUIRED");
    this.tools.set(tool.name, tool as SyntheticTool<unknown, unknown>);
  }

  execute<TOutput>(name: string, input: unknown): TOutput {
    const tool = this.tools.get(name);
    if (!tool) throw new Error("SYNTHETIC_TOOL_NOT_ALLOWLISTED");
    const parsed = tool.inputSchema.parse(input);
    return tool.outputSchema.parse(tool.execute(parsed)) as TOutput;
  }
}
