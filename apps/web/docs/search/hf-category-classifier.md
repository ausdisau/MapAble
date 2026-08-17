# Hugging Face category classifier (phase 3)

Optional **small-model** shortcut for `serviceCategorySlug` hints. The Vercel AI SDK interpreter remains the source of truth for multi-field extraction (location, access, provider name).

## When to use

- High volume of short category-routing queries where LLM cost/latency dominates.
- After you have a validated SFT model on the Hub.

If `SEARCH_INTERPRETER_CLASSIFIER_HUB_ID` is unset, the classifier path is skipped.

## Dataset format (SFT)

Messages JSONL for TRL / HF Jobs (`scripts/build-category-classifier-dataset.ts`):

```json
{
  "messages": [
    { "role": "user", "content": "Wheelchair taxi near Parramatta" },
    { "role": "assistant", "content": "{\"slug\":\"accessible-transport\"}" }
  ]
}
```

Sources:

- `prisma/seed-search-autocomplete.ts` category rows
- `HERO_SUGGESTED_SEARCHES_FALLBACK` and paraphrase templates in the dataset script

Validate with the Hugging Face dataset inspector before GPU jobs.

## Training (HF Jobs)

Example flow (adjust hardware and repo for your org):

1. Build dataset: `npx tsx scripts/build-category-classifier-dataset.ts --out data/category-classifier-sft.jsonl`
2. Upload to a private dataset or pass the file to Jobs.
3. Train with LoRA on a small base (e.g. `Qwen/Qwen2.5-0.5B`) on `t4-small` or `a10g-large`, `push_to_hub=true`, timeout ≥ 2h, Trackio enabled.
4. Set `SEARCH_INTERPRETER_CLASSIFIER_HUB_ID` to the resulting repo id.

See the [Hugging Face model trainer](https://huggingface.co/docs) skill in Cursor for `hf_jobs` UV script patterns.

## Runtime

`lib/search/interpreter/classifier-hint.ts` calls the [HF Inference API](https://huggingface.co/docs/api-inference) when both `SEARCH_INTERPRETER_CLASSIFIER_HUB_ID` and `HF_TOKEN` (or `HUGGINGFACE_API_KEY`) are set.

- Parses `{"slug":"..."}` from model output.
- On failure or low confidence, returns `null` — **never blocks** interpretation.
- Suggested slug is passed into `resolveServiceCategory` and validated against Prisma like an LLM slug.

## Env

| Variable | Purpose |
| -------- | ------- |
| `SEARCH_INTERPRETER_CLASSIFIER_HUB_ID` | Hub model id |
| `HF_TOKEN` or `HUGGINGFACE_API_KEY` | Inference API bearer token |

## Related

- [Natural-language interpreter](./nl-interpreter.md)
