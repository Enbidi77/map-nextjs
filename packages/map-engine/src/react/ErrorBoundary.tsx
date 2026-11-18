import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface MapErrorBoundaryProps {
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    console.error('[MapEngine ErrorBoundary] Caught map rendering error:', error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            minHeight: '250px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '24px',
            color: '#1e293b',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>Map Render Error</h3>
          <p
            style={{
              margin: '0 0 16px 0',
              fontSize: '13px',
              color: '#64748b',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            {this.state.error.message || 'An unexpected error occurred while initializing the map.'}
          </p>
          <button
            onClick={this.reset}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
          >
            Retry Loading Map
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
