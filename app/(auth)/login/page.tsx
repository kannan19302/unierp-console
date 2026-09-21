"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { Shield, Lock, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import styles from "./login.module.css";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Expires=${expires}; SameSite=Lax`;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || searchParams.get("return_to") || "/home";
  const { status, signIn } = useSession();

  const [email, setEmail] = useState("test.agent@unierp.com");
  const [password, setPassword] = useState("TestAgent123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect straight to target page
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(returnTo);
    }
  }, [status, returnTo, router]);

  const handleLogin = async (credentials?: { email: string; password: string }) => {
    setError(null);
    setLoading(true);

    const loginEmail = credentials?.email ?? email;
    const loginPassword = credentials?.password ?? password;

    try {
      let csrf = getCookie("csrf_token");
      if (!csrf) {
        // Issue a CSRF token
        csrf = "csrf_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        setCookie("csrf_token", csrf, 1);
      }

      const res = await fetch("/api/v1/auth/provider/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf,
        },
        credentials: "include",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Sign in failed (${res.status})`);
      }

      if (data.token) {
        setCookie("auth_token", data.token, 7);
        try {
          localStorage.setItem("token", data.token);
        } catch {}
      }

      // Hard navigation to re-initialize React auth shell cleanly
      window.location.assign(returnTo);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check credentials.");
      setLoading(false);
    }
  };

  const handleTestAgentQuickLogin = () => {
    handleLogin({
      email: "test.agent@unierp.com",
      password: "TestAgent123!",
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card} role="region" aria-labelledby="login-title">
        <header className={styles.header}>
          <div className={styles.badge}>
            <Shield size={12} />
            <span>Control Plane</span>
          </div>
          <h1 id="login-title" className={styles.title}>
            UniERP Console
          </h1>
          <p className={styles.subtitle}>
            Authenticate with provider operator credentials to access platform operations.
          </p>
        </header>

        {error && (
          <div className={styles.error} role="alert">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.quickSection}>
          <button
            type="button"
            className={styles.testAgentBtn}
            onClick={handleTestAgentQuickLogin}
            disabled={loading}
          >
            <Sparkles size={16} />
            <span>
              {loading ? "Authenticating Operator…" : "Sign In as Universal Test Agent"}
            </span>
          </button>
        </div>

        <div className={styles.divider}>
          <span>Or with credentials</span>
        </div>

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Operator Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@unierp.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            <Lock size={14} />
            <span>{loading ? "Verifying Credentials…" : "Sign In to Console"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className={styles.divider}>
          <span>Identity Provider</span>
        </div>

        <button
          type="button"
          className={styles.ssoBtn}
          onClick={() => signIn({ returnTo })}
        >
          Enterprise OIDC Hosted Login
        </button>
      </div>
    </div>
  );
}
