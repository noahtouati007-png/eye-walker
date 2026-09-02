"use client";

import React from "react";

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("Eye-Walker error:", error);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: undefined });
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0f",
            color: "#f0f0ff",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div className="glass" style={{ padding: 32, maxWidth: 420 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👁️‍🗨️</div>
            <h1
              className="font-display"
              style={{ fontSize: 22, marginBottom: 8, color: "#00d4ff" }}
            >
              Une erreur est survenue
            </h1>
            <p style={{ color: "#8888aa", marginBottom: 20, fontSize: 14 }}>
              L&apos;application a rencontré un problème inattendu. Tes données sont
              sauvegardées localement.
            </p>
            <button
              onClick={this.handleReset}
              className="focus-ring"
              style={{
                background: "linear-gradient(135deg,#00d4ff,#a855f7)",
                color: "#0a0a0f",
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Recharger l&apos;application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
