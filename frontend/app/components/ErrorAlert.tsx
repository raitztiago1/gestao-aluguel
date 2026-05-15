'use client';

type ErrorAlertProps = {
  message: string;
  title?: string;
  onDismiss?: () => void;
};

export default function ErrorAlert({ message, title = 'Algo deu errado', onDismiss }: ErrorAlertProps) {
  if (!message.trim()) {
    return null;
  }

  return (
    <div className='alert-card alert-error alert-error-rich' role='alert' aria-live='polite'>
      <div className='alert-error-content'>
        <div className='alert-error-icon' aria-hidden='true'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
            <path
              d='M12 8v5m0 3h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z'
              stroke='currentColor'
              strokeWidth='1.8'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>
        <div>
          <strong className='alert-error-title'>{title}</strong>
          <p className='alert-error-message'>{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button type='button' className='alert-error-dismiss' onClick={onDismiss} aria-label='Fechar mensagem de erro'>
          ×
        </button>
      )}
    </div>
  );
}
