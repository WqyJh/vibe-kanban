import { useGateway } from '@/contexts/GatewayContext';

export function GatewayMachineSelectPage() {
  const { machines, selectMachine, connectionError, logout } = useGateway();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Select Machine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a connected machine to access.
        </p>
      </div>

      {connectionError && (
        <p className="text-sm text-destructive text-center">
          {connectionError}
        </p>
      )}

      {machines.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No machines online.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure your vibe-kanban server is running with{' '}
            <code className="bg-muted px-1 rounded">
              VK_GATEWAY_URL={window.location.origin}
            </code>
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {machines.map((m) => (
            <button
              key={m.machine_id}
              onClick={() => selectMachine(m.machine_id)}
              className="w-full rounded-md border border-input bg-background px-4 py-3 text-left hover:bg-accent transition-colors"
            >
              <div className="font-medium text-sm">
                {m.hostname || m.machine_id}
              </div>
              {m.platform && (
                <div className="text-xs text-muted-foreground">
                  {m.platform}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <button onClick={logout} className="text-primary underline">
          Sign out
        </button>
      </p>
    </div>
  );
}
