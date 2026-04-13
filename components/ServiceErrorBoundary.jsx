"use client";

import { Component } from "react";

/**
 * ServiceErrorBoundary — PART 1
 *
 * Wraps every Work With Us service panel. If any service component throws
 * during render or in a lifecycle, the whole app does NOT crash. Instead,
 * a friendly fallback UI is shown and the panel can be closed cleanly.
 *
 * Must be a class component — React error boundaries cannot be function
 * components (hooks do not cover render-phase errors).
 */
export default class ServiceErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[Work With Us] Service panel crashed:", error?.message ?? error);
    console.error("[Work With Us] Component stack:", info?.componentStack ?? "(unavailable)");
  }

  handleClose = () => {
    this.setState({ hasError: false });
    this.props.onClose?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          zIndex: 49,
          height: "85vh",
          background: "rgba(8,8,20,0.97)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(239,68,68,0.22)",
          borderBottom: "none",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 14, padding: "32px 24px",
        }}>
          {/* Drag handle */}
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            width: 36, height: 4, borderRadius: 2,
            background: "rgba(255,255,255,0.10)",
          }} />

          <div style={{ fontSize: 28, lineHeight: 1 }}>⚠️</div>

          <div style={{
            fontSize: 13, fontFamily: "monospace", fontWeight: "bold",
            color: "#fca5a5", textAlign: "center", letterSpacing: "0.04em",
          }}>
            Something went wrong.
          </div>

          <div style={{
            fontSize: 11, fontFamily: "monospace", color: "#64748b",
            textAlign: "center", lineHeight: 1.65, maxWidth: 280,
          }}>
            This service hit an unexpected error. Please close and try again.
            Your data has not been lost.
          </div>

          <button
            onClick={this.handleClose}
            style={{
              marginTop: 4,
              padding: "10px 26px", borderRadius: 10, cursor: "pointer",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.30)",
              color: "#f87171", fontSize: 12,
              fontFamily: "monospace", letterSpacing: "0.04em",
              transition: "all 0.15s ease",
            }}
          >
            ← Close Service
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
