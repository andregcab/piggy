import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { AuthPageLayout } from '@/components/AuthPageLayout';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } })?.from
      ?.pathname ?? '/';

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageLayout
      title="Sign in"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <div className="flex gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          New here?{' '}
          <Link
            to="/register"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Create an account
          </Link>{' '}
          to get started.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p
            id="login-error"
            ref={errorRef}
            role="alert"
            className="rounded-md bg-destructive/10 p-2 text-sm text-destructive"
            tabIndex={-1}
          >
            {error}
          </p>
        )}
        <div>
          <label
            htmlFor="username"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Username
          </label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-muted"
            required
            autoComplete="username"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-muted"
            required
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
