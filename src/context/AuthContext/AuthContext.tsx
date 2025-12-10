import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AuthContextValue, AuthState, LoginCredentials, RegisterCredentials, User } from "./types";

const AUTH_STORAGE_KEY = "vanta_auth";

// Fake user for development - auto-login
const FAKE_USER: User = {
  id: "user-kashley556",
  username: "kashley556",
  email: "kennethxashley@gmail.com",
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // Auto-login with fake user for development
  useEffect(() => {
    // Always use the fake user for now
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(FAKE_USER));
    setState({
      user: FAKE_USER,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(credentials),
      // });
      // const data = await response.json();

      // For now, simulate successful login
      const user: User = {
        id: crypto.randomUUID(),
        username: credentials.username,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Login failed",
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(credentials),
      // });
      // const data = await response.json();

      // For now, simulate successful registration
      const user: User = {
        id: crypto.randomUUID(),
        username: credentials.username,
        email: credentials.email,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Registration failed",
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      clearError,
    }),
    [state, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
