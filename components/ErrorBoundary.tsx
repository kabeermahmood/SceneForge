"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("SceneForge Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/20">
            <AlertTriangle size={32} className="text-error" />
          </div>
          <div className="text-center">
            <h2 className="font-heading text-xl font-bold text-text-primary">
              Something went wrong
            </h2>
            <p className="mt-2 max-w-md text-sm text-text-secondary">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-accent-hover"
          >
            Start Over
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
