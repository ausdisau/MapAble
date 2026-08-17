export interface TaskBoardItem {
  id: string;
  title: string;
  status: string;
  waitingOn: string | null;
  dueAt: string | null;
  caseTitle: string;
}

interface TaskBoardProps {
  tasks: TaskBoardItem[];
}

export function TaskBoard({ tasks }: TaskBoardProps) {
  const openTasks = tasks.filter((t) => t.status === "open");
  const waitingTasks = openTasks.filter((t) => t.waitingOn);

  return (
    <section aria-labelledby="task-board-heading" className="space-y-4">
      <h2 id="task-board-heading" className="font-heading text-lg font-semibold">
        Task board
      </h2>

      {waitingTasks.length > 0 && (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium">
            {waitingTasks.length} task{waitingTasks.length === 1 ? "" : "s"}{" "}
            waiting on someone else
          </p>
        </div>
      )}

      {openTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open tasks.</p>
      ) : (
        <ul className="space-y-2">
          {openTasks.map((task) => (
            <li
              key={task.id}
              className="rounded-lg border p-3 text-sm"
              aria-label={`Task: ${task.title}`}
            >
              <p className="font-medium">{task.title}</p>
              <p className="text-muted-foreground">{task.caseTitle}</p>
              {task.waitingOn ? (
                <p className="mt-1 text-amber-700 dark:text-amber-400">
                  Waiting on: {task.waitingOn}
                </p>
              ) : null}
              {task.dueAt ? (
                <p className="mt-1 text-muted-foreground">
                  Due: {new Date(task.dueAt).toLocaleDateString("en-AU")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
