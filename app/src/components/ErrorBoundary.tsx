import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleResetToHome = () => {
    try {
      localStorage.removeItem('admin_pin');
      window.location.hash = '#/';
    } catch (_) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-4 font-body-md">
          <div className="bg-surface border border-ui-divider shadow-xl rounded-2xl p-6 max-w-lg w-full flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">error_outline</span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-surface">Terjadi Kendala Tampilan</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Aplikasi mengalami kendala saat merender komponen. Anda dapat memuat ulang aplikasi untuk melanjutkan.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-left overflow-x-auto max-h-40">
                <p className="text-xs font-mono font-bold text-red-800 dark:text-red-300 break-words">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetToHome}
                className="flex-1 bg-surface-container hover:bg-surface-variant text-on-surface font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">home</span>
                <span>Halaman Utama</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
