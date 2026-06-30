# MapAble From-Scratch LLM — Implementation Spec (Cursor AI handoff)

> **Status:** Design + implementation plan only. **No training code, inference
> server, or Node app changes live in this Replit repo.** This document is the
> single source of truth a Cursor AI agent (or a human) picks up in a separate,
> GPU-capable dev environment to build MapAble's own from-scratch LLM and wire it
> into MapAble Chat as a drop-in alternative to the OpenAI provider.
>
> **Curriculum basis:** freeCodeCamp — "Code an LLM From Scratch — Theory to
> RLHF" (pure PyTorch). This spec is self-contained; you do **not** need to
> re-read the article to execute it.

---

## 0. How to use this document

- Read §1–§3 to understand the goal and the exact contract the model must honour.
- Build the model in `llm/` following §4–§12 (one milestone per section group).
- Wire it into MapAble in §13 — this is the only part that touches the Node app,
  and it is done **in the MapAble repo, in Cursor**, not here.
- §14 is the Cursor handoff appendix: environment, bootstrap, repo layout, and
  copy-paste prompts (one per milestone).
- §15 captures risks, open questions, and explicit out-of-scope items so the
  agent does not drift.

---

## 1. Goals & non-goals

### 1.1 Goals
1. Train a small, from-scratch decoder-only transformer in **pure PyTorch**,
   end-to-end through the full modern stack: tokenizer → pretraining → modern
   architecture enhancements → Mixture-of-Experts → SFT → reward modeling →
   RLHF/PPO.
2. Serve the trained model behind an **OpenAI-Chat-Completions-compatible HTTP
   API** (the `/v1/chat/completions` shape), **including function/tool calling**,
   so MapAble Chat can switch to it with an env flag and **zero changes to the
   tool loop, guardrails, rules engine, or client**.
3. Make the MapAble integration a clean **provider interface** so `openai` and
   `mapable` are interchangeable and either can be selected per environment.

### 1.2 Non-goals (for this from-scratch effort)
- Beating GPT-4o on quality. The aim is a *correct, controllable, owned* model
  that satisfies the contract — quality is iterated later.
- Distributed/multi-node training. Single-GPU (or single-box multi-GPU via
  `torchrun`) is assumed; the curriculum scales down.
- Production hosting decisions (where the served model eventually runs).
- Real NDIS fine-tuning data collection (gated by the co-design protocol — see
  §15.3).

---

## 2. Current MapAble Chat surface (the contract to replicate)

The new provider must reproduce **exactly** what the engine currently expects
from OpenAI. This section is the authoritative contract; everything in §13 wires
to it.

### 2.1 Where the LLM is called
`server/chat/engine.ts` is the only place that talks to the model. Today:

```ts
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: chatHistory,         // system + prior turns + current user turn
  tools: turnTools,              // narrowed per-turn tool schemas (see §2.3)
  tool_choice: "auto",
  max_tokens: 2048,
});
```

`server/chat-engine.ts` is a thin shim re-exporting `server/chat/` — do not
re-add logic there.

### 2.2 The tool loop (must be preserved verbatim in behaviour)
1. The engine builds `chatHistory`: `{ role: "system", content: SYSTEM_PROMPT }`,
   then prior messages mapped to `{ role: "user" | "assistant", content }`, then
   the current user turn (`inputVerdict.transformedInput`).
2. It calls `chat.completions.create(...)` in a loop, **max 5 iterations**.
3. If `choice.finish_reason === "tool_calls"` and `choice.message.tool_calls`
   exists:
   - push `choice.message` (the assistant message carrying `tool_calls`) onto
     `chatHistory`;
   - for each tool call where `toolCall.type === "function"`: parse
     `toolCall.function.arguments` as JSON (fallback `{}`), record
     `toolCall.function.name` in `toolsUsed`, dispatch to
     `registry.getHandler(name)(args, ctx)`, and push the **string** result back
     as `{ role: "tool", tool_call_id: toolCall.id, content: toolResult }`;
   - continue the loop.
4. Otherwise take `choice.message.content` as the final assistant text and break.

**Implication for the new provider:** it must return, per OpenAI's schema:
- `choices[0].finish_reason` — must be `"tool_calls"` when the model wants to
  call tools, otherwise `"stop"`.
- `choices[0].message.tool_calls[]` — each with `id` (string),
  `type: "function"`, and `function: { name, arguments }` where `arguments` is a
  **JSON string**.
- `choices[0].message.content` — assistant text on a non-tool turn.

The model must accept `role: "tool"` messages with `tool_call_id` and
`role: "assistant"` messages that carry `tool_calls` (no content), because those
are fed back on subsequent iterations.

### 2.3 Tool schema shape
Tools are standard OpenAI `ChatCompletionTool` objects, owned by capability
modules in `server/chat/modules/*` and flattened per turn by `ModuleRegistry`.
Shape (from `server/chat/types.ts` / README):

```ts
{
  type: "function",
  function: {
    name: "book_shift",
    description: "...",
    parameters: { type: "object", properties: { /* ... */ }, required: [ /* ... */ ] },
  },
}
```

Current tool inventory (the model must be able to call any of these by name with
JSON args — it does **not** need to know what they do, only to emit valid calls):

| Module | Tools | Always-on |
| --- | --- | --- |
| `profile` | `get_user_profile`, `update_user_profile` | ✅ |
| `transport` | `search_transport_workers`, `get_transport_pricing`, `book_transport` | |
| `barriers` | `check_barrier_reports`, `list_my_barrier_reports`, `submit_barrier_report`, `update_barrier_report` | |
| `shifts` | `get_upcoming_shifts`, `book_shift` | |
| `billing` | `get_pending_invoices`, `get_budget_summary` | |
| `ndis` | `get_ndis_plan_goals` | |
| `grocery` | `search_grocery_products`, `get_grocery_orders`, `navigate_to_groceries`, `view_grocery_cart` | |
| `safeguarding` | `log_incident_draft`, `log_complaint_draft`, `record_consent`, `flag_safeguarding_concern` | ✅ |
| `handoff` | `escalate_to_human` | ✅ |

> The exact tool list is discovered at runtime from the registry — treat the
> table as indicative, not hardcoded. The provider must pass through **whatever**
> `tools` array the engine supplies.

### 2.4 Response shape returned by the engine (downstream of the model)
The engine post-processes the model output and returns a `ChatResponse` to the
client. **This is unchanged by the provider swap** — listed here so you do not
accidentally move this logic into the provider:

```ts
interface ChatResponse {
  content: string;       // after rules engine + output guardrails
  quickActions: string[];// derived by quick-actions.ts from content + toolsUsed
  confidence: string;    // "high" | "medium" | "general", from determineConfidence(toolsUsed)
  warnings: string[];    // from the rules engine (accessibility/budget)
  toolsUsed: string[];   // tool names called this turn
}
```

`extractQuickActions(content, toolsUsed)` and `determineConfidence(toolsUsed)`
live in `server/chat/quick-actions.ts` and operate purely on the final content +
tool names. They are **provider-agnostic** and must stay where they are.

### 2.5 Guardrails wrap the model on both sides (provider-agnostic)
From `server/chat-guardrails.ts`, the engine applies:
- **Before the model:** `classifyUserTurn(userMessage, isStaffOrAdmin)` →
  `GuardrailVerdict`. A blocking/template verdict short-circuits with a
  safeguarding template **before any model call** (and may run
  `runRequiredSafeguardingActions`). The text actually sent to the model is
  `inputVerdict.transformedInput`, not the raw user text.
- **System prompt:** `SYSTEM_PROMPT` = `buildPolicySystemPrompt()` (policy-pack
  preamble) + the accessibility persona (`server/chat/prompt.ts`).
- **After the model:** `applyOutputGuardrails(content)` → may rewrite content,
  add `actions`/`policyRefs`, and set `flagged`. Then the rules engine
  (`applyRulesEngine`) adds warnings. Then `logGuardrailAudit(...)` writes an
  audit row.

**Critical design rule:** guardrails, the rules engine, audit logging, intent
router, registry, and persistence are **outside** the provider boundary. The
provider's *only* job is "messages + tools in → OpenAI-shaped completion out".
Both `openai` and `mapable` providers sit behind the same seam and are wrapped
identically. (Task #29 guardrail work continues to wrap both, unchanged.)

### 2.6 Other call sites to keep working
- `server/replit_integrations/chat/routes.ts` calls `processChat(...)` and
  streams a single SSE chunk. It does not call the model directly — swapping the
  provider inside the engine covers it.
- `server/routes/chat-community.ts` calls `processInbound(webPlatformAdapter, …)`.
- `client/src/components/chatbot-widget/*` consumes the `ChatResponse` JSON only.
None of these change.

---

## 3. Target repo layout (the future `llm/` Python project)

Built in the **MapAble repo** (so the provider in §13 can reference artifacts) or
a sibling repo — your call in Cursor. Suggested layout:

```
llm/
  pyproject.toml            # uv/poetry; ruff + pytest configured
  README.md
  configs/
    tokenizer.yaml
    pretrain.yaml
    moe.yaml
    sft.yaml
    reward.yaml
    ppo.yaml
    serve.yaml
  data/                     # gitignored; raw + processed shards
  mapable_llm/
    __init__.py
    tokenizer/
      bpe.py                # train + encode/decode
      train_tokenizer.py
    model/
      config.py             # ModelConfig dataclass
      transformer.py        # blocks, attention, MLP
      rmsnorm.py
      rope.py
      kv_cache.py
      moe.py                # Mixture-of-Experts FFN
      model.py              # top-level CausalLM
    train/
      pretrain.py
      sft.py
      reward_model.py
      ppo.py                # RLHF
      data.py               # dataset/sharding/collators
      utils.py              # mixed precision, checkpointing, lr schedule
    serve/
      app.py                # FastAPI OpenAI-compatible server
      openai_schema.py      # pydantic request/response models
      tool_calling.py       # tool-call parsing/formatting
      generate.py           # sampling + KV-cache decode loop
    eval/
      harness.py            # perplexity + tool-call accuracy + refusal checks
  tests/
    test_tokenizer.py
    test_model_forward.py
    test_kv_cache.py
    test_moe.py
    test_tool_calling.py
    test_openai_schema.py
```

---

## 4. Milestone M1 — Tokenizer + transformer

### 4.1 Tokenizer
- Implement byte-level **BPE** (`mapable_llm/tokenizer/bpe.py`): train merges
  from a corpus, `encode(str) -> list[int]`, `decode(list[int]) -> str`.
- Reserve **special tokens** up front (you will need them for SFT and tool
  calling): `<|bos|>`, `<|eos|>`, `<|pad|>`, `<|user|>`, `<|assistant|>`,
  `<|system|>`, `<|tool|>`, and tool-call delimiters
  `<|tool_call|>` / `<|tool_call_end|>` (see §10.2).
- Persist vocab + merges to `data/tokenizer/`. Round-trip must be lossless.

### 4.2 Transformer (decoder-only)
- `ModelConfig` (dataclass): `vocab_size`, `d_model`, `n_layers`, `n_heads`,
  `n_kv_heads` (for GQA, optional), `d_ff`, `max_seq_len`, `dropout`,
  `rope_theta`, `norm_eps`, plus MoE fields (added in M3).
- Block: pre-norm → causal multi-head self-attention → residual → pre-norm →
  MLP → residual. Start with LayerNorm + learned/absolute positions to get a
  baseline forward/backward pass green, then swap in RMSNorm + RoPE in M2.
- Weight tying between token embedding and the output head.

### 4.3 Acceptance (M1)
- `pytest tests/test_tokenizer.py` — encode/decode round-trips on a sample.
- `pytest tests/test_model_forward.py` — forward pass returns logits of shape
  `(batch, seq, vocab)`; loss is finite; a 2-step overfit on a tiny batch drives
  loss down.

---

## 5. Milestone M2 — Pretraining loop + modern enhancements

### 5.1 Pretraining loop (`train/pretrain.py`)
- Causal LM objective (next-token cross-entropy, ignore `<|pad|>`).
- Data pipeline (`train/data.py`): tokenize corpus → pack into fixed-length
  `max_seq_len` blocks → shard to disk → streaming `Dataset`/`DataLoader`.
- Optimizer AdamW, cosine LR schedule with warmup, gradient clipping, gradient
  accumulation. Periodic checkpointing + resume (`train/utils.py`).
- Log train/val loss + perplexity (stdout + optional Weights & Biases/CSV).

### 5.2 Modern enhancements (fold in here)
- **RMSNorm** (`model/rmsnorm.py`) replacing LayerNorm.
- **RoPE** (`model/rope.py`) applied to Q/K (replace absolute positions).
- **KV cache** (`model/kv_cache.py`) for inference-time incremental decoding.
- **Mixed precision** — `torch.autocast` + `GradScaler` (bf16 if supported,
  else fp16). Optional `torch.compile`.
- Optional: grouped-query attention (`n_kv_heads < n_heads`) and SwiGLU MLP.

### 5.3 Acceptance (M2)
- Val perplexity decreases over training on a held-out split.
- `pytest tests/test_kv_cache.py` — greedy decode **with** KV cache produces
  identical token ids to decode **without** cache (correctness guard).
- A resumed checkpoint continues training without a loss discontinuity.

---

## 6. Milestone M3 — Mixture-of-Experts layer

- `model/moe.py`: replace the dense FFN in a configurable subset of blocks with
  an MoE FFN — `n_experts` expert MLPs + a top-k gating network (`top_k`,
  typically 1–2) + load-balancing auxiliary loss.
- Config: `use_moe`, `moe_layers` (which layers), `n_experts`, `moe_top_k`,
  `aux_loss_coef`.
- Add the aux loss to the training loss; log expert utilisation to confirm the
  router is not collapsing to one expert.

### 6.1 Acceptance (M3)
- `pytest tests/test_moe.py` — output shape matches the dense FFN; routing is
  top-k; aux loss is finite and > 0.
- Short MoE training run shows balanced-ish expert utilisation and val
  perplexity at or below the dense baseline at equal active params.

---

## 7. Milestone M4 — Supervised Fine-Tuning (SFT)

- Chat formatting using the special tokens from §4.1:
  `<|system|>…<|user|>…<|assistant|>…<|eos|>`.
- **Loss masking:** compute loss only on assistant tokens (mask system/user).
- `train/sft.py`: load a pretrained checkpoint, fine-tune on instruction/chat
  pairs. Keep the same optimizer/precision/checkpoint utilities.
- **Tool-calling SFT (essential for MapAble):** include examples where the
  assistant emits a tool call in the canonical serialized format (§10.2) given a
  rendered tool list, plus examples that consume a `<|tool|>` result and produce
  a final answer. Without this, the model will not reliably emit valid tool
  calls and the MapAble tool loop will not work.

### 7.1 Acceptance (M4)
- Generations follow the chat template and stop at `<|eos|>`.
- On a held-out tool-calling eval, the model emits parseable tool calls with
  valid JSON arguments for the provided tool names at a tracked accuracy
  (establish a baseline; target ≥ ~80% parseable before relying on it).

---

## 8. Milestone M5 — Reward Modeling (RM)

- `train/reward_model.py`: a model with a scalar reward head (reuse the
  transformer trunk, swap the LM head for a value head).
- Train on preference pairs `(prompt, chosen, rejected)` with the Bradley-Terry
  pairwise logistic loss: maximise `logsigmoid(r_chosen - r_rejected)`.
- Save the RM checkpoint for PPO.

### 8.1 Acceptance (M5)
- Held-out pairwise preference accuracy meaningfully > 50% (establish baseline,
  target ≥ ~65%).
- Reward scores are calibrated enough that obviously-better completions score
  higher on spot checks.

---

## 9. Milestone M6 — RLHF with PPO

- `train/ppo.py`: standard RLHF loop —
  1. sample completions from the **policy** (SFT model) for a batch of prompts;
  2. score them with the **reward model** (§8);
  3. compute advantages; apply a **KL penalty** against a frozen reference
     (the SFT model) to prevent reward hacking;
  4. PPO clipped objective update on the policy.
- Components: policy, frozen reference, reward model, optional value head.
  Log mean reward, KL, and policy/value loss.

### 9.1 Acceptance (M6)
- Mean reward rises while KL stays bounded (no collapse / gibberish).
- Qualitative: RLHF model is more helpful/safe than the SFT model on a fixed
  prompt suite **without** regressing tool-call validity (re-run the M4 eval).

---

## 10. Milestone M7 — OpenAI-compatible inference server

This is the linchpin for MapAble: the server must speak the **exact** subset of
the OpenAI Chat Completions API that `server/chat/engine.ts` uses.

### 10.1 Endpoint
`POST /v1/chat/completions` (FastAPI, `serve/app.py`). Optional bearer-token auth
via a shared secret. Request fields to support (others may be ignored/echoed):

```jsonc
{
  "model": "mapable-llm",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": null, "tool_calls": [ /* see below */ ] },
    { "role": "tool", "tool_call_id": "call_abc", "content": "{...json...}" }
  ],
  "tools": [ { "type": "function", "function": { "name": "...", "description": "...", "parameters": { /* json schema */ } } } ],
  "tool_choice": "auto",
  "max_tokens": 2048,
  "temperature": 0.2,
  "stream": false
}
```

Response (non-streaming) — must match OpenAI so the `openai` Node SDK parses it:

```jsonc
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1730000000,
  "model": "mapable-llm",
  "choices": [
    {
      "index": 0,
      "finish_reason": "tool_calls",          // or "stop"
      "message": {
        "role": "assistant",
        "content": null,                       // text when finish_reason="stop"
        "tool_calls": [
          { "id": "call_abc", "type": "function",
            "function": { "name": "book_shift", "arguments": "{\"workerId\":\"...\"}" } }
        ]
      }
    }
  ],
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

> The MapAble engine reads only: `choices[0].finish_reason`,
> `choices[0].message.content`, and `choices[0].message.tool_calls[].{id, type,
> function.name, function.arguments}`. `arguments` **must be a JSON string**.
> `usage` may be zeros. Streaming is **not required** by the current engine
> (the Replit chat route wraps a single completion in one SSE chunk) — implement
> `stream: true` later if desired.

### 10.2 Tool-call serialization & parsing (`serve/tool_calling.py`)
1. **Render tools into the prompt.** Convert the `tools` array into a textual
   tool manifest appended to the system prompt (name, description, JSON-schema
   parameters), with an instruction that to call a tool the model emits exactly:

   ```
   <|tool_call|>{"name": "<tool_name>", "arguments": { ... }}<|tool_call_end|>
   ```

   Train the SFT data (§7) to use this format so inference matches.
2. **Render history.** Map OpenAI roles to the chat template: `system`→`<|system|>`,
   `user`→`<|user|>`, `assistant` (with `tool_calls`)→ serialized tool-call block,
   `assistant` (text)→`<|assistant|>…`, `tool`→`<|tool|>{tool_call_id}: {content}`.
3. **Parse output.** If generated text contains a `<|tool_call|>…<|tool_call_end|>`
   block (and `tool_choice !== "none"`), extract `name` + `arguments`, validate
   `arguments` against the tool's JSON schema, set `finish_reason="tool_calls"`,
   and emit a synthetic `id` (`call_` + random). Support **multiple** tool-call
   blocks in one turn. Otherwise return the text with `finish_reason="stop"`.
4. **Robustness.** If JSON args fail to parse, retry generation once; if still
   invalid, fall back to returning text (`finish_reason="stop"`) so the MapAble
   loop degrades gracefully rather than crashing.

### 10.3 Generation (`serve/generate.py`)
- KV-cache incremental decode (§5.2). Sampling: temperature/top-p; greedy when
  `temperature == 0`. Respect `max_tokens`; stop on `<|eos|>` or
  `<|tool_call_end|>`.

### 10.4 Acceptance (M7)
- `pytest tests/test_openai_schema.py` — request/response pydantic models match
  the shapes in §10.1; a tool-call response round-trips through the **`openai`
  Node SDK** parser (write a tiny Node smoke harness, or assert the JSON shape
  field-by-field).
- `pytest tests/test_tool_calling.py` — given a tools array + a prompt that
  should trigger a call, the server returns `finish_reason="tool_calls"` with
  valid JSON `arguments`; given a chat-only prompt it returns `"stop"` + text.
- Manual: point a local `OpenAI({ baseURL })` client at the server and complete
  a 2-turn tool round-trip (assistant tool_call → tool result → final answer).

---

## 11. Milestone M8 — MapAble provider switch

See §13 for the full integration design. Acceptance:
- `CHAT_LLM_PROVIDER=openai` (default) behaves exactly as today.
- `CHAT_LLM_PROVIDER=mapable` routes the engine's completion call to the new
  server with **no other code path changes**; the existing tool loop, guardrails,
  rules engine, quick actions, confidence, persistence, and audit all run
  unchanged.
- The MapAble smoke test (`server/__tests__/smoke.test.ts`) stays green; add a
  provider-selection unit test.

---

## 12. Pipeline overview (text diagram)

```
        ┌──────────────┐
corpus →│  Tokenizer   │ (M1)
        └──────┬───────┘
               ▼
        ┌──────────────┐   RMSNorm/RoPE/KV-cache/AMP (M2)
        │  Pretrain    │───────────────────────────────────┐
        └──────┬───────┘                                    │
               ▼                                            │
        ┌──────────────┐  MoE FFN + aux loss (M3)           │
        │  +MoE        │                                    │
        └──────┬───────┘                                    │
               ▼                                            ▼
        ┌──────────────┐   loss-masked, tool-call SFT (M4)  ┌─────────────┐
        │  SFT         │──────────────────────────────────▶│  Inference  │ (M7)
        └──────┬───────┘                                    │  OpenAI-API │
               ▼                                            │  + tools    │
        ┌──────────────┐  Bradley-Terry pairwise (M5)       └──────┬──────┘
        │  Reward Model│                                           │
        └──────┬───────┘                                           ▼
               ▼                                            ┌─────────────┐
        ┌──────────────┐  PPO + KL-to-ref (M6)              │  MapAble    │ (M8)
        │  RLHF/PPO    │──────────────▶ final policy ──────▶│  provider   │
        └──────────────┘                                    │  switch     │
                                                            └─────────────┘
```

---

## 13. MapAble integration design (the only Node-side change, done in Cursor)

> All of §13 is implemented **in the MapAble repo within Cursor**, not in this
> Replit project. It is specified here so the work is unambiguous.

### 13.1 Provider interface
Introduce a minimal seam that both providers implement. Suggested location:
`server/chat/providers/`.

```ts
// server/chat/providers/types.ts
import type OpenAI from "openai";

export interface ChatCompletionRequest {
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  tools: OpenAI.Chat.Completions.ChatCompletionTool[];
  toolChoice?: "auto" | "none";
  maxTokens?: number;
}

export interface LlmProvider {
  readonly name: "openai" | "mapable";
  createCompletion(
    req: ChatCompletionRequest,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion>;
}
```

Keeping the return type as the OpenAI `ChatCompletion` means **the engine's tool
loop in `engine.ts` does not change at all** — it keeps reading `finish_reason`,
`message.content`, and `message.tool_calls` exactly as in §2.2.

### 13.2 Two implementations
- `server/chat/providers/openai.ts` — wraps the existing client; literally the
  current `openai.chat.completions.create({ model: "gpt-4o", ... })` call moved
  behind `createCompletion`.
- `server/chat/providers/mapable.ts` — also uses the `openai` Node SDK but with
  `baseURL = MAPABLE_LLM_BASE_URL` and `model = "mapable-llm"` (the SDK speaks to
  any OpenAI-compatible server). This means **no new HTTP client is needed** —
  the from-scratch server's job (M7) is to be SDK-compatible.

```ts
// server/chat/providers/mapable.ts (sketch)
const client = new OpenAI({
  apiKey: process.env.MAPABLE_LLM_API_KEY ?? "not-needed",
  baseURL: process.env.MAPABLE_LLM_BASE_URL, // e.g. http://localhost:8000/v1
});
// createCompletion → client.chat.completions.create({ model: process.env.MAPABLE_LLM_MODEL ?? "mapable-llm", ... })
```

### 13.3 Provider selection
```ts
// server/chat/providers/index.ts
export function getChatProvider(): LlmProvider {
  return process.env.CHAT_LLM_PROVIDER === "mapable"
    ? mapableProvider
    : openaiProvider; // default
}
```

`engine.ts` change is one line in spirit: replace the direct
`openai.chat.completions.create(...)` with
`getChatProvider().createCompletion({ messages: chatHistory, tools: turnTools, toolChoice: "auto", maxTokens: 2048 })`.
Everything else in `processChat` is untouched.

### 13.4 Provider-switch flow (text diagram)
```
user turn
   │
   ▼
classifyUserTurn (input guardrails)  ── blocks? → safeguarding template (no model call)
   │ not blocked
   ▼
buildChatContext → intent router → registry tools
   │
   ▼
getChatProvider()            CHAT_LLM_PROVIDER
   ├── "openai"  → OpenAI gpt-4o ─────────────┐
   └── "mapable" → MAPABLE_LLM_BASE_URL /v1 ──┤  (identical ChatCompletion shape)
                                              ▼
                          engine tool loop (max 5 iters, dispatch handlers)
                                              ▼
        applyRulesEngine → applyOutputGuardrails → quickActions + confidence
                                              ▼
              persist assistant message → logGuardrailAudit → ChatResponse
```

### 13.5 Guardrails & Task #29 continuity
Because the provider seam sits **inside** `processChat` and **after**
`classifyUserTurn` / before `applyOutputGuardrails`, both the input and output
guardrails, the rules engine, the audit log, and the Task #29 safeguarding work
wrap **both** providers identically with zero extra wiring. Do **not** move any
guardrail logic into the providers.

### 13.6 New env vars (documented when M8 lands, not before)
- `CHAT_LLM_PROVIDER` — `openai` (default) | `mapable`.
- `MAPABLE_LLM_BASE_URL` — base URL of the from-scratch inference server
  (e.g. `http://localhost:8000/v1`).
- `MAPABLE_LLM_MODEL` — served model id (default `mapable-llm`).
- `MAPABLE_LLM_API_KEY` — optional bearer for the server.

### 13.7 Integration acceptance
- Default boot (no new env) is byte-for-byte current behaviour.
- With the server running and `CHAT_LLM_PROVIDER=mapable`, a transport-pricing
  question triggers `get_transport_pricing`, the tool result is consumed, and a
  final answer with quick actions + confidence is returned.
- `server/__tests__/smoke.test.ts` green; new provider-selection test green.

---

## 14. Cursor AI handoff appendix

### 14.1 Assumed environment
- A GPU box or workstation (single NVIDIA GPU sufficient for the scaled-down
  curriculum; bf16 preferred). CUDA + recent PyTorch. **Not** Replit — do not
  attempt to install PyTorch/ML deps in the Replit project.
- Python 3.11+.

### 14.2 Tooling
- **uv** (preferred) or **poetry** for env + deps.
- **ruff** for lint/format, **pytest** for tests, **mypy** optional.
- Optional: Weights & Biases for run tracking.

### 14.3 Repo bootstrap
```bash
mkdir -p llm && cd llm
uv init && uv add torch numpy tqdm pydantic fastapi uvicorn pyyaml
uv add --dev ruff pytest
# scaffold the package layout from §3, then:
uv run pytest -q
```

### 14.4 Branch / PR strategy
- One branch + PR **per milestone** (`llm/m1-tokenizer`, `llm/m2-pretrain`, …,
  `llm/m8-provider-switch`).
- Each PR must land its milestone's acceptance tests green before merge.
- M8 (the only Node-side change) is a separate PR in the MapAble repo, gated on a
  running M7 server; keep it behind the default-off `CHAT_LLM_PROVIDER` flag.

### 14.5 Copy-paste Cursor prompts (one per milestone)
> Paste the relevant prompt into Cursor at the start of each milestone. Each
> assumes this spec is in the repo at `docs/llm/mapable-llm-spec.md`.

**M1**
```
Read docs/llm/mapable-llm-spec.md §3–§4. Implement the byte-level BPE tokenizer
and the decoder-only transformer baseline (LayerNorm + absolute positions) in the
llm/ package per §3's layout. Add the special tokens from §4.1. Make
tests/test_tokenizer.py and tests/test_model_forward.py pass (round-trip + finite
loss + tiny-batch overfit). Use uv + ruff + pytest. Do not touch the MapAble Node app.
```

**M2**
```
Read §5. Implement the pretraining loop with packed fixed-length blocks, AdamW,
cosine LR + warmup, grad accumulation, checkpoint/resume. Swap in RMSNorm and RoPE,
add a KV cache, and enable mixed precision (autocast + GradScaler). Make
tests/test_kv_cache.py pass (cached vs uncached greedy decode identical) and show
val perplexity decreasing. Do not touch the MapAble Node app.
```

**M3**
```
Read §6. Add a Mixture-of-Experts FFN (top-k gating, n_experts, load-balancing
aux loss) usable in configurable layers. Make tests/test_moe.py pass and log
expert utilisation to confirm no router collapse. Do not touch the MapAble Node app.
```

**M4**
```
Read §7 and §10.2. Implement loss-masked SFT with the chat template, including
tool-calling examples that emit and consume the <|tool_call|>…<|tool_call_end|>
format. Hit the tool-call validity target on a held-out eval. Do not touch the
MapAble Node app.
```

**M5**
```
Read §8. Implement a reward model with a scalar head trained on preference pairs
with the Bradley-Terry pairwise loss. Report held-out pairwise accuracy. Do not
touch the MapAble Node app.
```

**M6**
```
Read §9. Implement RLHF with PPO: sample from the policy, score with the reward
model, KL-penalise against a frozen SFT reference, clipped PPO update. Show mean
reward rising with bounded KL and no regression on the M4 tool-call eval. Do not
touch the MapAble Node app.
```

**M7**
```
Read §10 and §2 (the MapAble contract). Build a FastAPI server exposing
POST /v1/chat/completions that is byte-compatible with the OpenAI Node SDK,
including function/tool calling per §10.2, KV-cache generation, and graceful
fallback on invalid tool JSON. Make tests/test_openai_schema.py and
tests/test_tool_calling.py pass, and verify a 2-turn tool round-trip with a real
OpenAI({ baseURL }) client.
```

**M8 (MapAble repo)**
```
Read §13 and §2 of docs/llm/mapable-llm-spec.md. In the MapAble repo, add the
LlmProvider seam under server/chat/providers/ with openai (default) and mapable
implementations, select via CHAT_LLM_PROVIDER, and route engine.ts's completion
call through getChatProvider().createCompletion(...) WITHOUT changing the tool
loop, guardrails, rules engine, quick actions, confidence, persistence, or audit.
Keep server/__tests__/smoke.test.ts green and add a provider-selection test.
Document the new env vars in replit.md only when this lands.
```

---

## 15. Risks, open questions, out-of-scope

### 15.1 Risks
- **Tool-call reliability.** A small from-scratch model may emit malformed tool
  JSON. Mitigations: dedicated tool-calling SFT (§7), schema validation + single
  retry + graceful text fallback (§10.2.4), and the engine's existing
  `try/catch` around `JSON.parse(arguments)` (already tolerant).
- **Quality gap vs GPT-4o.** Expected; keep `CHAT_LLM_PROVIDER` default `openai`
  and treat `mapable` as opt-in per environment until quality is acceptable.
- **Safety.** Guardrails wrap both providers, but a weaker base model may need
  stronger output guardrails. Re-run the guardrail red-team suite
  (`RED_TEAM_GUARDRAIL_CASES`) against the `mapable` provider before any
  participant-facing use.
- **Compute.** Full RLHF is compute-hungry; scale model/data down to fit the
  available GPU rather than chasing scale.

### 15.2 Open questions (decide in Cursor)
- Final model size (`d_model`/`n_layers`/`n_experts`) vs available VRAM.
- Pretraining corpus sources and licensing.
- Whether to keep `llm/` in the MapAble monorepo or a sibling repo.
- Streaming (`stream: true`) — add only if a future channel needs token
  streaming; the current engine does not.

### 15.3 Out of scope (do not drift)
- Any PyTorch/training/tokenizer/inference code **in this Replit repo**.
- Any change to `server/chat/engine.ts`, chat routes, or the chatbot widget **in
  this Replit repo** (the §13 work happens in Cursor, in the MapAble repo, as M8).
- Installing PyTorch or ML deps in this Replit project.
- Real NDIS fine-tuning data / co-design work — gated by
  `docs/co-design-protocol.md` (overlaps Task #20); do not collect or train on
  participant data here.
- Choosing the production hosting target for the trained model.
```
