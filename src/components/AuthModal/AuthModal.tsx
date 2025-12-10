import { Trans } from "@lingui/macro";
import { useCallback, useState } from "react";

import { useAuth } from "context/AuthContext";

import Button from "components/Button/Button";
import Modal from "components/Modal/Modal";

import "./AuthModal.css";

type AuthMode = "login" | "register";

type Props = {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
};

export function AuthModal({ isVisible, setIsVisible }: Props) {
  const { login, register, error, isLoading, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setLocalError(null);
    clearError();
  }, [clearError]);

  const handleModeSwitch = useCallback(
    (newMode: AuthMode) => {
      setMode(newMode);
      resetForm();
    },
    [resetForm]
  );

  const handleClose = useCallback(() => {
    setIsVisible(false);
    resetForm();
  }, [setIsVisible, resetForm]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLocalError(null);

      if (!username.trim()) {
        setLocalError("Username is required");
        return;
      }

      if (!password) {
        setLocalError("Password is required");
        return;
      }

      if (mode === "register") {
        if (password !== confirmPassword) {
          setLocalError("Passwords do not match");
          return;
        }
        if (password.length < 6) {
          setLocalError("Password must be at least 6 characters");
          return;
        }
      }

      try {
        if (mode === "login") {
          await login({ username, password });
        } else {
          await register({ username, email: email || undefined, password });
        }
        handleClose();
      } catch {
        // Error is handled by the auth context
      }
    },
    [username, email, password, confirmPassword, mode, login, register, handleClose]
  );

  const displayError = localError || error;

  return (
    <Modal
      isVisible={isVisible}
      setIsVisible={handleClose}
      label={mode === "login" ? <Trans>Sign In</Trans> : <Trans>Create Account</Trans>}
      className="AuthModal"
    >
      <form onSubmit={handleSubmit} className="AuthModal-form">
        <div className="AuthModal-field">
          <label htmlFor="username" className="AuthModal-label">
            <Trans>Username</Trans>
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="AuthModal-input"
            placeholder="Enter username"
            autoComplete="username"
            disabled={isLoading}
          />
        </div>

        {mode === "register" && (
          <div className="AuthModal-field">
            <label htmlFor="email" className="AuthModal-label">
              <Trans>Email (optional)</Trans>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="AuthModal-input"
              placeholder="Enter email"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
        )}

        <div className="AuthModal-field">
          <label htmlFor="password" className="AuthModal-label">
            <Trans>Password</Trans>
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="AuthModal-input"
            placeholder="Enter password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            disabled={isLoading}
          />
        </div>

        {mode === "register" && (
          <div className="AuthModal-field">
            <label htmlFor="confirmPassword" className="AuthModal-label">
              <Trans>Confirm Password</Trans>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="AuthModal-input"
              placeholder="Confirm password"
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>
        )}

        {displayError && <div className="AuthModal-error">{displayError}</div>}

        <Button variant="primary" type="submit" disabled={isLoading} className="AuthModal-submit">
          {isLoading ? (
            <Trans>Loading...</Trans>
          ) : mode === "login" ? (
            <Trans>Sign In</Trans>
          ) : (
            <Trans>Create Account</Trans>
          )}
        </Button>

        <div className="AuthModal-switch">
          {mode === "login" ? (
            <Trans>
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => handleModeSwitch("register")} className="AuthModal-switch-link">
                Create one
              </button>
            </Trans>
          ) : (
            <Trans>
              Already have an account?{" "}
              <button type="button" onClick={() => handleModeSwitch("login")} className="AuthModal-switch-link">
                Sign in
              </button>
            </Trans>
          )}
        </div>
      </form>
    </Modal>
  );
}
