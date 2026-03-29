import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { AuthPageLayout } from '@/components/AuthPageLayout';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { cn } from '@/lib/utils';
import { validateUsername, validatePassword } from '@/lib/validation';

export function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmRef = useRef<HTMLInputElement>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    } else if (fieldErrors.username) {
      usernameRef.current?.focus();
    } else if (fieldErrors.password) {
      passwordRef.current?.focus();
    } else if (fieldErrors.passwordConfirm) {
      passwordConfirmRef.current?.focus();
    }
  }, [
    error,
    fieldErrors.username,
    fieldErrors.password,
    fieldErrors.passwordConfirm,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const usernameErr = validateUsername(username);
    const passwordErr = validatePassword(password);
    const confirmErr =
      password !== passwordConfirm ? 'Passwords do not match' : null;

    if (usernameErr || passwordErr || confirmErr) {
      setFieldErrors({
        username: usernameErr ?? undefined,
        password: passwordErr ?? undefined,
        passwordConfirm: confirmErr ?? undefined,
      });
      return;
    }

    setLoading(true);
    try {
      await register(username, password, passwordConfirm);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageLayout
      title="Create account"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p
            id="register-error"
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
            ref={usernameRef}
            id="username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (fieldErrors.username)
                setFieldErrors((f) => ({
                  ...f,
                  username: undefined,
                }));
            }}
            className={cn(
              'bg-muted',
              fieldErrors.username && 'border-destructive',
            )}
            required
            autoComplete="username"
            aria-invalid={!!fieldErrors.username}
            aria-describedby={
              fieldErrors.username ? 'username-error' : undefined
            }
          />
          {fieldErrors.username && (
            <p
              id="username-error"
              className="mt-1 text-xs text-destructive"
            >
              {fieldErrors.username}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Password
          </label>
          <PasswordInput
            ref={passwordRef}
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password)
                setFieldErrors((f) => ({
                  ...f,
                  password: undefined,
                }));
              if (
                fieldErrors.passwordConfirm &&
                e.target.value !== passwordConfirm
              ) {
                setFieldErrors((f) => ({
                  ...f,
                  passwordConfirm: 'Passwords do not match',
                }));
              } else if (
                fieldErrors.passwordConfirm &&
                e.target.value === passwordConfirm
              ) {
                setFieldErrors((f) => ({
                  ...f,
                  passwordConfirm: undefined,
                }));
              }
            }}
            className={cn(
              'bg-muted',
              fieldErrors.password && 'border-destructive',
            )}
            required
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.password}
            aria-describedby={
              fieldErrors.password ? 'password-error' : undefined
            }
          />
          <p className="mt-1 text-xs text-muted-foreground">
            At least 8 characters, with one uppercase, one lowercase,
            and one number
          </p>
          {fieldErrors.password && (
            <p
              id="password-error"
              className="mt-1 text-xs text-destructive"
            >
              {fieldErrors.password}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="passwordConfirm"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Confirm password
          </label>
          <PasswordInput
            ref={passwordConfirmRef}
            id="passwordConfirm"
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              if (fieldErrors.passwordConfirm)
                setFieldErrors((f) => ({
                  ...f,
                  passwordConfirm: undefined,
                }));
            }}
            className={cn(
              'bg-muted',
              fieldErrors.passwordConfirm && 'border-destructive',
            )}
            required
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.passwordConfirm}
            aria-describedby={
              fieldErrors.passwordConfirm
                ? 'passwordConfirm-error'
                : undefined
            }
          />
          {fieldErrors.passwordConfirm && (
            <p
              id="passwordConfirm-error"
              className="mt-1 text-xs text-destructive"
            >
              {fieldErrors.passwordConfirm}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
