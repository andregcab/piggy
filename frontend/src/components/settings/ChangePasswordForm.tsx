import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { validatePassword } from '@/lib/validation';
import { getMutationErrorMessage } from '@/lib/error-utils';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (passwordError) {
      errorRef.current?.focus();
    }
  }, [passwordError]);

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    const newErr = validatePassword(newPassword);
    const confirmErr =
      newPassword !== newPasswordConfirm
        ? 'Passwords do not match'
        : null;
    if (newErr || confirmErr) {
      setPasswordError(newErr ?? confirmErr ?? '');
      return;
    }
    setChangingPassword(true);
    api('/auth/me/password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      }),
    })
      .then(() => {
        setPasswordMessage('Password changed.');
        setCurrentPassword('');
        setNewPassword('');
        setNewPasswordConfirm('');
      })
      .catch((err) => {
        const msg = getMutationErrorMessage(
          err,
          'Failed to change password',
        );
        setPasswordError(msg);
        toast.error(msg);
      })
      .finally(() => setChangingPassword(false));
  }

  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <PasswordInput
          id="currentPassword"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="newPassword">New password</Label>
        <PasswordInput
          ref={newPasswordRef}
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoComplete="new-password"
          aria-invalid={!!passwordError}
          aria-describedby={
            passwordError ? 'change-password-error' : undefined
          }
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters, with one uppercase, one lowercase,
          and one number
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="newPasswordConfirm">
          Confirm new password
        </Label>
        <PasswordInput
          id="newPasswordConfirm"
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
          required
          autoComplete="new-password"
          aria-invalid={!!passwordError}
          aria-describedby={
            passwordError ? 'change-password-error' : undefined
          }
        />
      </div>
      {passwordError && (
        <p
          id="change-password-error"
          ref={errorRef}
          role="alert"
          className="text-sm text-destructive"
          tabIndex={-1}
        >
          {passwordError}
        </p>
      )}
      {passwordMessage && (
        <p className="text-sm text-[var(--positive)]">
          {passwordMessage}
        </p>
      )}
      <Button
        type="submit"
        variant="outline"
        disabled={changingPassword}
      >
        {changingPassword ? 'Changing...' : 'Change password'}
      </Button>
    </form>
  );
}
