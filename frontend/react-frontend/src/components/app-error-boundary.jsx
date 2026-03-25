import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application render failed:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <h1>Frontend crashed during render.</h1>
          <p>{this.state.error.message || "Unknown error."}</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error.stack}
          </pre>
        </main>
      );
    }

    return this.props.children;
  }
}
