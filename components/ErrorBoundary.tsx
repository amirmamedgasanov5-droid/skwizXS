import React, { ErrorInfo, ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // Explicitly declare props to fix TS error
  declare props: Readonly<Props>;

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SQUWIZ Critical Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6">
             <X size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ошибка матрицы</h1>
          <p className="text-gray-400 mb-6 text-sm max-w-md">
            Произошел критический сбой.
            <br/><br/>
            <span className="font-mono text-xs text-red-400 bg-red-900/20 p-2 rounded block">
              {this.state.error?.message || "Unknown Error"}
            </span>
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-transform"
          >
            Перезагрузить систему
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}