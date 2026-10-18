import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="pt-24 pb-16 min-h-screen bg-cream flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-background border border-border rounded-xl p-6 sm:p-8 text-center shadow-lg">
            <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
              Something went wrong
            </h1>
            <p className="font-sans text-xs sm:text-sm text-muted-foreground mb-6">
              {this.state.error?.message || "An unexpected error occurred while loading this view."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-2 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = "/";
                }}
                className="font-sans font-medium gap-2 text-xs"
              >
                <Home className="w-3.5 h-3.5" /> Go Home
              </Button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
