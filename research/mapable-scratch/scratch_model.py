"""MapAble scratch model research seed. No pretrained model weights or tokeniser.
For the complete version (tests, eval, API and integration scaffolds), use
the separately delivered MapAble Scratch Model v0.1 source archive.
"""
import argparse
import hashlib
import json
from pathlib import Path

import torch
from torch import nn
import torch.nn.functional as F
from safetensors.torch import save_file


class ByteTokenizer:
    vocab_size = 259

    def encode(self, text: str):
        return [256] + list(text.encode("utf-8")) + [257]

    def decode(self, ids):
        return bytes(n for n in ids if 0 <= n < 256).decode("utf-8", "replace")


class SelfAttention(nn.Module):
    def __init__(self, dim=64, heads=4):
        super().__init__()
        assert dim % heads == 0
        self.dim, self.heads = dim, heads
        self.qkv = nn.Linear(dim, 3 * dim)
        self.proj = nn.Linear(dim, dim)

    def forward(self, x):
        b, t, d = x.shape
        q, k, v = self.qkv(x).split(d, dim=-1)
        q, k, v = [z.view(b, t, self.heads, d // self.heads).transpose(1, 2)
                   for z in (q, k, v)]
        att = (q @ k.transpose(-2, -1)) * ((d // self.heads) ** -0.5)
        mask = torch.tril(torch.ones(t, t, dtype=torch.bool, device=x.device))
        att = att.masked_fill(~mask, torch.finfo(att.dtype).min)
        y = torch.softmax(att, dim=-1) @ v
        return self.proj(y.transpose(1, 2).contiguous().view(b, t, d))


class Block(nn.Module):
    def __init__(self, dim=64):
        super().__init__()
        self.ln1, self.ln2 = nn.LayerNorm(dim), nn.LayerNorm(dim)
        self.attn = SelfAttention(dim)
        self.ff = nn.Sequential(nn.Linear(dim, 4 * dim), nn.GELU(),
                                nn.Linear(4 * dim, dim))

    def forward(self, x):
        x = x + self.attn(self.ln1(x))
        return x + self.ff(self.ln2(x))


class ScratchLM(nn.Module):
    def __init__(self, dim=64, layers=2, context=64):
        super().__init__()
        self.context = context
        self.emb = nn.Embedding(259, dim)
        self.pos = nn.Embedding(context, dim)
        self.blocks = nn.ModuleList([Block(dim) for _ in range(layers)])
        self.norm = nn.LayerNorm(dim)
        self.head = nn.Linear(dim, 259, bias=False)
        self.apply(self.initialise)

    @staticmethod
    def initialise(module):
        if isinstance(module, (nn.Linear, nn.Embedding)):
            nn.init.normal_(module.weight, mean=0, std=0.02)
            if isinstance(module, nn.Linear) and module.bias is not None:
                nn.init.zeros_(module.bias)

    def forward(self, ids, target=None):
        b, n = ids.shape
        if n > self.context or n < 1:
            raise ValueError("invalid context")
        x = self.emb(ids) + self.pos(torch.arange(n, device=ids.device))[None]
        for layer in self.blocks:
            x = layer(x)
        logits = self.head(self.norm(x))
        loss = None if target is None else F.cross_entropy(
            logits.reshape(-1, 259), target.reshape(-1))
        return logits, loss


def train(steps: int):
    if not 1 <= steps <= 200:
        raise ValueError("research-only step limit")
    torch.manual_seed(42)
    torch.set_num_threads(2)
    lines = [
        "A person can choose how they communicate.",
        "A support request is a draft until confirmed.",
        "An accessibility observation is not a guarantee.",
        "The participant can stop AI processing at any time.",
        "Only synthetic research examples are allowed here.",
        "An AI model cannot authorise a care or funding decision.",
        "Evidence needs a source, scope, date, and reviewer.",
        "The person with disability remains the decision maker.",
    ]
    tokenizer = ByteTokenizer()
    ids = torch.tensor(sum((tokenizer.encode(line) for line in lines), []), dtype=torch.long)
    model = ScratchLM()
    opt = torch.optim.AdamW(model.parameters(), lr=0.003)
    losses = []
    for _ in range(steps):
        start = torch.randint(0, len(ids) - 65, (4,))
        x = torch.stack([ids[n:n + 64] for n in start])
        y = torch.stack([ids[n + 1:n + 65] for n in start])
        _, loss = model(x, y)
        opt.zero_grad()
        loss.backward()
        opt.step()
        losses.append(round(float(loss), 5))
    out = Path("research-output")
    out.mkdir(exist_ok=True)
    weights = out / "scratch-seed.safetensors"
    save_file({k: v.detach().cpu().contiguous() for k, v in model.state_dict().items()}, str(weights))
    manifest = {
        "research_only": True, "production_ready": False,
        "origin": "random_initialisation_no_pretrained_weights",
        "steps": steps, "seed": 42,
        "parameters": sum(p.numel() for p in model.parameters()),
        "loss_first": losses[0], "loss_last": losses[-1],
        "weights_sha256": hashlib.sha256(weights.read_bytes()).hexdigest(),
        "note": "This tiny synthetic text model is not fit for user-facing language tasks.",
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--steps", type=int, default=12)
    train(parser.parse_args().steps)
