# Route model

## Graph

- **Nodes** (`IndoorRouteNode`): entrance, junction, lift, destination, etc.
- **Edges** (`IndoorRouteEdge`): step-free flag, width, gradient, trust level, operational status.

Stored optionally in floor plan document as `routeGraph`.

## Modes

`step_free`, `shortest_verified`, `low_sensory`, `avoid_lifts`, `avoid_stairs`, etc.

## Algorithm

Deterministic Dijkstra in `lib/indoor-accessibility/routing/route-planner.ts`.

## No-route explanations

Structured `reasons` array when path not found.

## Multi-floor

Connector features link floors; user must confirm floor changes in viewer (existing connector UI).
