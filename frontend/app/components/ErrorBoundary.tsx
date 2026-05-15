'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorAlert from './ErrorAlert';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: ''
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Ocorreu um erro inesperado na interface.'
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro capturado pela interface:', error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className='container'>
          <ErrorAlert
            title='Erro na aplicação'
            message={this.state.message}
            onDismiss={this.handleRetry}
          />
          <div className='card'>
            <p className='page-subtitle'>
              A página encontrou um problema, mas você pode tentar continuar. Se o erro persistir, recarregue a aba
              do navegador.
            </p>
            <button type='button' className='button button-primary' onClick={() => window.location.reload()}>
              Recarregar página
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
