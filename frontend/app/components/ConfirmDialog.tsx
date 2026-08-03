'use client';

import { useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../lib/errors';
import ErrorAlert from './ErrorAlert';
import Modal from './Modal';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pendingLabel?: string;
  errorFallback?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Excluir',
  pendingLabel = 'Excluindo...',
  errorFallback = 'Não foi possível concluir a exclusão.',
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmingRef = useRef(false);
  const isMountedRef = useRef(true);
  const isOpenRef = useRef(isOpen);
  const lifecycleRef = useRef(0);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  isOpenRef.current = isOpen;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    lifecycleRef.current += 1;
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleCancel = () => {
    setError(null);
    onCancel();
  };

  const handleConfirm = async () => {
    if (confirmingRef.current) return;

    const operationLifecycle = lifecycleRef.current;
    confirmingRef.current = true;
    setIsPending(true);
    setError(null);

    try {
      await onConfirm();
      if (
        isMountedRef.current
        && isOpenRef.current
        && operationLifecycle === lifecycleRef.current
      ) {
        handleCancel();
      }
    } catch (err) {
      if (
        isMountedRef.current
        && isOpenRef.current
        && operationLifecycle === lifecycleRef.current
      ) {
        setError(getErrorMessage(err, errorFallback));
      }
    } finally {
      confirmingRef.current = false;
      if (isMountedRef.current) {
        setIsPending(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      description={message}
      onClose={handleCancel}
      size='small'
      closeOnBackdrop={false}
      blocked={isPending}
      role='alertdialog'
      initialFocusRef={cancelButtonRef}
      actions={(
        <>
          <button
            ref={cancelButtonRef}
            type='button'
            className='button button-secondary'
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancelar
          </button>
          <button
            type='button'
            className='button button-danger'
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </>
      )}
    >
      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError(null)}
        />
      )}
      <span className='visually-hidden' role='status' aria-live='polite'>
        {isPending ? pendingLabel : ''}
      </span>
    </Modal>
  );
}
