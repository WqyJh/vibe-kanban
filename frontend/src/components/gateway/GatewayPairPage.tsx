import { useState } from 'react';
import { useGateway } from '@/contexts/GatewayContext';

export function GatewayPairPage() {
  const { addPairedSecret, pairError, logout } = useGateway();
  const [secretInput, setSecretInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretInput.trim()) {
      addPairedSecret(secretInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Pair Device</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the master secret from your vibe-kanban server.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Run <code className="bg-muted px-1 rounded">vibe-kanban login --gateway {window.location.origin}</code> on your server to get the master secret.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="secret"
            className="block text-sm font-medium mb-1"
          >
            Master Secret (base64)
          </label>
          <input
            id="secret"
            type="text"
            required
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            placeholder="Paste your 32-byte base64 master secret..."
          />
        </div>

        {pairError && (
          <p className="text-sm text-destructive">{pairError}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Pair
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <button onClick={logout} className="text-primary underline">
          Sign out
        </button>
      </p>
    </div>
  );
}
