# SDK generation workflows

CareOS does **not** commit generated SDKs. Use the OpenAPI fragment at `docs/api/openapi-careos-v1.yaml` with your preferred generator.

## Prerequisites

- OpenAPI Generator CLI (`npm i -g @openapitools/openapi-generator-cli`)
- Valid sandbox API key from `/developers` portal

## TypeScript

```bash
openapi-generator-cli generate \
  -i docs/api/openapi-careos-v1.yaml \
  -g typescript-fetch \
  -o ./generated/careos-ts \
  --additional-properties=supportsES6=true
```

Usage:

```typescript
import { Configuration, DefaultApi } from "./generated/careos-ts";

const api = new DefaultApi(
  new Configuration({
    basePath: "https://sandbox.careos.example/api/v1",
    apiKey: process.env.CAREOS_API_KEY,
    headers: { "X-Participant-Id": process.env.CAREOS_PARTICIPANT_ID },
  }),
);
```

## Python

```bash
openapi-generator-cli generate \
  -i docs/api/openapi-careos-v1.yaml \
  -g python \
  -o ./generated/careos-python \
  --additional-properties=packageName=careos_client
```

Usage:

```python
import careos_client
from careos_client.rest import ApiException

configuration = careos_client.Configuration(
    host="https://sandbox.careos.example/api/v1",
    api_key={"X-Api-Key": os.environ["CAREOS_API_KEY"]},
)
configuration.api_key_prefix = {"X-Api-Key": ""}
```

## C#

```bash
openapi-generator-cli generate \
  -i docs/api/openapi-careos-v1.yaml \
  -g csharp \
  -o ./generated/careos-csharp \
  --additional-properties=targetFramework=net8.0,packageName=CareOS.Client
```

Add generated projects to `.gitignore`:

```
generated/
```

## Webhook verification

Verify incoming webhooks with the signing helpers documented in `docs/careos/developer-platform.md`. Each language should implement HMAC-SHA256 over `{version}.{timestamp}.{payload}`.

## Sandbox

Always develop against sandbox keys (`ApiClient.environment = sandbox`). Sandbox returns synthetic data and blocks production participant identifiers.
