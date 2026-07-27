import type OpenAI from "openai";
import type { ChatModule, ToolHandler } from "./types";

/**
 * Indexes the registered modules so the engine can resolve tool schemas and
 * handlers by tool name without knowing which module owns them.
 */
export class ModuleRegistry {
  private readonly modules: ChatModule[];
  private readonly handlerIndex = new Map<string, ToolHandler>();
  private readonly moduleByTool = new Map<string, ChatModule>();

  constructor(modules: ChatModule[]) {
    this.modules = modules;
    for (const mod of modules) {
      for (const tool of mod.tools) {
        if (tool.type !== "function") continue;
        const handler = mod.handlers[tool.function.name];
        if (!handler) {
          throw new Error(
            `Module "${mod.name}" declares tool "${tool.function.name}" but provides no handler.`
          );
        }
        this.handlerIndex.set(tool.function.name, handler);
        this.moduleByTool.set(tool.function.name, mod);
      }
    }
  }

  getModules(): ChatModule[] {
    return this.modules;
  }

  getToolsFor(modules: ChatModule[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return modules.flatMap((m) => m.tools);
  }

  getAllTools(): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return this.getToolsFor(this.modules);
  }

  getHandler(toolName: string): ToolHandler | undefined {
    return this.handlerIndex.get(toolName);
  }

  getModuleForTool(toolName: string): ChatModule | undefined {
    return this.moduleByTool.get(toolName);
  }
}
