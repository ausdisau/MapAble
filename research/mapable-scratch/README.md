# MapAble Scratch Foundation Model - GitHub research seed

**State:** draft research source only. Does not change active MapAble gateway, identity, consent, billing, worker matching, or production deployments.

This branch demonstrates a decoder-only transformer written from random initialisation, with a reversible UTF-8 byte tokenizer, masked self-attention, AdamW next-token learning, synthetic-only corpus, safetensors checkpoint and SHA-256 receipt. It **does not** import any Google, Meta, or third-party pretrained model or tokenizer.

The independently executed full research package is **MapAble Scratch Model v0.1** (provided as a downloadable source archive to the requester). The full archive contains 14 locally passing Python tests, held-out evaluation, a research API, React Native screen and tests, a Vercel proxy template, a Neon schema, a Temporal workflow and an offline Hugging Face export. The GitHub seed is a **smaller self-contained example**, not a byte-for-byte copy of the full archive; its model/dataset, parameter count and benchmark results must not be confused with the full archive.

## Run the GitHub seed

From repository root, with PyTorch and safetensors installed:

\`\`\`bash
python research/mapable-scratch/scratch_model.py --steps 12
\`\`\`

The run produces \`research-output/\` locally; never commit or deploy weights without review.

## Why it is not ready to merge

The canonical MapAble feature-freeze document remains active. The source code is for review and reproducibility; it is not an authorised live AI feature. This draft is not a request to bypass consent or safeguarding. Model output does not grant authority to take actions or make clinical, NDIS, worker assignment or payment decisions.

Integrate only after executive waiver, source/data rights, independent validation, accessibility acceptance and security review. Never put an inference token in Expo apps; Vercel would route through the **existing** gated MapAble model platform, while training happens on separate compute. Neon run metadata and Temporal workflow setup must use an isolated, approved research environment.
