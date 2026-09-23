"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useToast } from "@/components/admin/toast";
import { ApiError, authApi, type AdminProfile } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";

function validatePassword(value: string): string | null {
  if (value.length < 10) return "Use at least 10 characters.";
  if (!/[a-z]/.test(value)) return "Include a lowercase letter.";
  if (!/[A-Z]/.test(value)) return "Include an uppercase letter.";
  if (!/\d/.test(value)) return "Include a number.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Include a symbol.";
  return null;
}

export default function AdminSettingsPage() {
  const { notify } = useToast();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const response = await authApi.me();
      setProfile(response.data.admin);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = "/admin/login?reason=expired";
        return;
      }
      notify("Unable to load account details.", "error");
    } finally {
      setLoadingProfile(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const nextErrors: Record<string, string> = {};
    if (!currentPassword) nextErrors.currentPassword = "Enter your current password.";
    const strength = validatePassword(newPassword);
    if (strength) nextErrors.newPassword = strength;
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    if (newPassword && newPassword === currentPassword) {
      nextErrors.newPassword = "Choose a password different from the current one.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword, confirmPassword });
      notify("Password updated successfully. Please sign in again.");
      setTimeout(() => {
        window.location.href = "/admin/login?reason=password-changed";
      }, 900);
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError) {
        if (error.errors) {
          const mapped: Record<string, string> = {};
          for (const [key, messages] of Object.entries(error.errors)) {
            mapped[key] = messages[0] ?? "Invalid value.";
          }
          setErrors(mapped);
        }
        notify(error.message, "error");
      } else {
        notify("Unable to update password.", "error");
      }
    }
  }

  const inputClass = "mt-1 w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none";

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your administrator account and security credentials.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">Account</h2>
        {loadingProfile ? (
          <div className="mt-4 space-y-2">
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
        ) : profile ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Name</dt>
              <dd className="text-ink">{profile.fullName}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Email</dt>
              <dd className="text-ink">{profile.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Role</dt>
              <dd className="text-ink">{profile.role}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Last sign-in</dt>
              <dd className="text-ink">
                {profile.lastLoginAt ? formatDateTime(profile.lastLoginAt) : "—"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Account details are unavailable.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">Change password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Passwords must be at least 10 characters and include upper and lower case letters, a
          number, and a symbol. All active sessions are signed out after a change.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
          <div>
            <label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
              Current password
            </label>
            <input
              id="currentPassword"
              type={showPasswords ? "text" : "password"}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              aria-invalid={Boolean(errors.currentPassword)}
              aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
              className={`${inputClass} ${
                errors.currentPassword
                  ? "border-red-400 bg-red-50"
                  : "border-slate-300 focus:border-brand"
              }`}
            />
            {errors.currentPassword ? (
              <p id="currentPassword-error" className="mt-1 text-xs text-red-600">
                {errors.currentPassword}
              </p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                id="newPassword"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                aria-invalid={Boolean(errors.newPassword)}
                aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
                className={`${inputClass} ${
                  errors.newPassword
                    ? "border-red-400 bg-red-50"
                    : "border-slate-300 focus:border-brand"
                }`}
              />
              {errors.newPassword ? (
                <p id="newPassword-error" className="mt-1 text-xs text-red-600">
                  {errors.newPassword}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                className={`${inputClass} ${
                  errors.confirmPassword
                    ? "border-red-400 bg-red-50"
                    : "border-slate-300 focus:border-brand"
                }`}
              />
              {errors.confirmPassword ? (
                <p id="confirmPassword-error" className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(event) => setShowPasswords(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Show passwords
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60"
          >
            {saving ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">Security notes</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Sessions expire automatically after 8 hours of validity.</li>
          <li>Accounts lock for 15 minutes after 5 consecutive failed sign-in attempts.</li>
          <li>All create, update, publish, and delete actions are recorded in the audit log.</li>
          <li>Passwords are stored using bcrypt hashing and are never logged or returned by the API.</li>
        </ul>
      </section>
    </div>
  );
}
