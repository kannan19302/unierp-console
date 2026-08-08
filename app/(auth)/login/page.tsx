"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, ChevronRight, AlertCircle, KeyRound, Smartphone } from "lucide-react";
import { Spinner } from "@kannan19302/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaChallengeToken, setMfaChallengeToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/provider/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      if (data.mfaRequired) {
        setMfaRequired(true);
        setMfaChallengeToken(data.challengeToken);
        setLoading(false);
        return;
      }
      
      localStorage.setItem("token", data.token);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/mfa/verify-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken: mfaChallengeToken, code: mfaCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "MFA verification failed");

      localStorage.setItem("token", data.token);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: 32, backgroundColor: "white", borderRadius: 8, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          <Shield size={24} style={{ color: "#3b82f6" }} />
          <h1 style={{ fontSize: 24, fontWeight: "bold", margin: 0 }}>Console</h1>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: 4, marginBottom: 16 }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: 14 }}>{error}</span>
          </div>
        )}

        {mfaRequired ? (
          <form onSubmit={handleMfaVerify} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#4b5563" }}>Enter your authenticator code</p>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>MFA Code</label>
              <div style={{ position: "relative" }}>
                <KeyRound size={16} style={{ position: "absolute", left: 12, top: 12, color: "#9ca3af" }} />
                <input
                  type="text"
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #d1d5db", borderRadius: 4, boxSizing: "border-box" }}
                  placeholder="123456"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? <Spinner size="sm" /> : "Verify Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Provider Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 12, top: 12, color: "#9ca3af" }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #d1d5db", borderRadius: 4, boxSizing: "border-box" }}
                  placeholder="admin@provider.com"
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 12, top: 12, color: "#9ca3af" }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #d1d5db", borderRadius: 4, boxSizing: "border-box" }}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? <Spinner size="sm" /> : <>Sign In <ChevronRight size={16} /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
