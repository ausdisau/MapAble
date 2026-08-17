import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CopilotAction, CopilotActionType } from "@/lib/copilot/types";

type Props = {
  actions: CopilotAction[];
  blockedActions?: CopilotAction[];
  onAction?: (type: CopilotActionType) => void;
};

export function CopilotActionCards({
  actions,
  blockedActions = [],
  onAction,
}: Props) {
  if (actions.length === 0 && blockedActions.length === 0) return null;

  return (
    <section aria-labelledby="copilot-actions-heading">
      <h3 id="copilot-actions-heading" className="mb-3 text-base font-semibold">
        Suggested next steps
      </h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <li key={action.type}>
            <Card
              variant="interactive"
              className="h-full"
              role={onAction ? "button" : undefined}
              tabIndex={onAction ? 0 : undefined}
              onClick={
                onAction
                  ? () => onAction(action.type)
                  : undefined
              }
              onKeyDown={
                onAction
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onAction(action.type);
                      }
                    }
                  : undefined
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{action.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {action.requiresConfirmation
                  ? "Requires your confirmation"
                  : onAction
                    ? "Tap to continue"
                    : "Information only"}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {blockedActions.length > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Some actions need sign-in:{" "}
          {blockedActions.map((a) => a.label).join(", ")}
        </p>
      ) : null}
    </section>
  );
}
