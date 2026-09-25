import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Uncaught application error:', error, errorInfo);
  }

  private handleCopy = () => {
    const errorDetails = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-stone-200 shadow-xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-xs">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mb-2">
              Terjadi Kendala Teknis
            </h1>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              Aplikasi mendeteksi error tak terduga pada antarmuka. Data belanja dan keranjang Anda tetap tersimpan dengan aman.
            </p>

            {this.state.error && (
              <div className="text-left bg-stone-900 text-stone-300 p-4 rounded-xl text-xs font-mono mb-6 overflow-x-auto max-h-40 border border-stone-800">
                <p className="text-red-400 font-semibold mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                <p className="text-stone-500 whitespace-pre-wrap text-[11px]">
                  {this.state.error.stack?.split('\n').slice(1, 4).join('\n')}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Ke Beranda</span>
              </button>

              <button
                type="button"
                onClick={this.handleCopy}
                title="Salin rincian error untuk tim teknis"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl text-xs font-medium transition-colors"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Log</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
