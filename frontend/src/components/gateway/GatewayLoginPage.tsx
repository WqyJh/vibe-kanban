import { useState } from 'react';
import { useGateway } from '@/contexts/GatewayContext';

export function GatewayLoginPage() {
  const {
    signup,
    login,
    authError,
    authLoading,
    registrationOpen,
  } = useGateway();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignupMode, setIsSignupMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignupMode) {
      await signup(email, password, name || undefined);
    } else {
      await login(email, password);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Vibe Kanban Gateway</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isSignupMode ? 'Create your account' : 'Sign in to continue'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignupMode && (
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Your name"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Password"
          />
        </div>

        {authError && (
          <p className="text-sm text-destructive">{authError}</p>
        )}

        <button
          type="submit"
          disabled={authLoading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {authLoading
            ? 'Loading...'
            : isSignupMode
              ? 'Sign Up'
              : 'Sign In'}
        </button>
      </form>

      {registrationOpen !== false && (
        <p className="text-center text-sm text-muted-foreground">
          {isSignupMode ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setIsSignupMode(false)}
                className="text-primary underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setIsSignupMode(true)}
                className="text-primary underline"
              >
                Sign up
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
