/**
 * GatewayGate — wraps the main App and shows gateway-specific UI
 * (login, pairing, machine selection) until the E2EE connection is ready.
 * In local mode, it renders children directly.
 */
import type { ReactNode } from 'react';
import { useGateway } from '@/contexts/GatewayContext';
import { GatewayLoginPage } from './GatewayLoginPage';
import { GatewayPairPage } from './GatewayPairPage';
import { GatewayMachineSelectPage } from './GatewayMachineSelectPage';

// Import styles so Tailwind classes work in gateway pages
import '@/styles/legacy/index.css';

export function GatewayGate({ children }: { children: ReactNode }) {
  const { phase } = useGateway();

  switch (phase) {
    case 'local':
      // Not gateway mode — render the app directly
      return <>{children}</>;

    case 'detecting':
      return (
        <GatewayShell>
          <p className="text-foreground opacity-60 animate-pulse text-center">
            Detecting...
          </p>
        </GatewayShell>
      );

    case 'login':
      return (
        <GatewayShell>
          <GatewayLoginPage />
        </GatewayShell>
      );

    case 'pair':
      return (
        <GatewayShell>
          <GatewayPairPage />
        </GatewayShell>
      );

    case 'machine_select':
      return (
        <GatewayShell>
          <GatewayMachineSelectPage />
        </GatewayShell>
      );

    case 'connecting':
      return (
        <GatewayShell>
          <p className="text-foreground opacity-60 animate-pulse text-center">
            Connecting to machine...
          </p>
        </GatewayShell>
      );

    case 'ready':
      return <>{children}</>;

    default:
      return <>{children}</>;
  }
}

function GatewayShell({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{gatewayStyles}</style>
      <div className="legacy-design gateway-shell">
        <div className="gateway-card">{children}</div>
      </div>
    </>
  );
}

const gatewayStyles = `
  .gateway-shell {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: hsl(var(--background));
  }

  .gateway-card {
    width: 100%;
    max-width: 28rem;
    background: hsl(var(--muted));
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    padding: 2rem;
    box-shadow: 0 4px 24px hsl(var(--foreground) / 0.08);
  }

  .gateway-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    color: hsl(var(--foreground));
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .gateway-input::placeholder {
    color: hsl(var(--foreground) / 0.5);
  }

  .gateway-input:focus {
    border-color: hsl(var(--ring));
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
  }

  .gateway-button-primary {
    width: 100%;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    background: hsl(var(--foreground));
    color: hsl(var(--background));
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .gateway-button-primary:hover {
    opacity: 0.85;
  }

  .gateway-button-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .gateway-link {
    color: hsl(var(--foreground));
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-size: inherit;
    font-family: inherit;
  }

  .gateway-link:hover {
    opacity: 0.8;
  }

  .gateway-error {
    padding: 0.75rem;
    background: hsl(var(--destructive) / 0.1);
    border: 1px solid hsl(var(--destructive) / 0.3);
    border-radius: var(--radius);
    color: hsl(var(--destructive));
  }

  .gateway-code-block {
    padding: 0.75rem;
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    font-size: 0.75rem;
    line-height: 1rem;
    opacity: 0.8;
    word-break: break-all;
  }

  .gateway-code-block code {
    background: hsl(var(--foreground) / 0.1);
    padding: 0.125rem 0.25rem;
    border-radius: calc(var(--radius) - 2px);
    font-family: inherit;
  }

  .gateway-machine-card {
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
    color: hsl(var(--foreground));
    font-family: inherit;
  }

  .gateway-machine-card:hover {
    background: hsl(var(--accent));
    border-color: hsl(var(--ring));
  }
`;
