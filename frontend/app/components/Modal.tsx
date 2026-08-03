'use client';

import {
  MouseEvent,
  PointerEvent,
  ReactNode,
  RefObject,
  useEffect,
  useId,
  useRef
} from 'react';

export type ModalSize = 'small' | 'default' | 'large';

type ModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  blocked?: boolean;
  role?: 'dialog' | 'alertdialog';
  titleId?: string;
  descriptionId?: string;
  initialFocusRef?: RefObject<HTMLElement>;
};

let openModalCount = 0;
let previousBodyOverflow = '';
let previousDocumentOverflow = '';

const acquireScrollLock = () => {
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  openModalCount += 1;
};

const releaseScrollLock = () => {
  if (openModalCount === 0) return;

  openModalCount -= 1;
  if (openModalCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousDocumentOverflow;
  }
};

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const canReceiveFocus = (
  element: HTMLElement | null | undefined
): element is HTMLElement => Boolean(
  element
  && element.isConnected
  && !element.hasAttribute('disabled')
  && element.getAttribute('aria-disabled') !== 'true'
  && element.getAttribute('aria-hidden') !== 'true'
  && !element.closest('[hidden], [inert], [aria-hidden="true"]')
  && element.getClientRects().length > 0
);

const isOutsideDialog = (
  dialog: HTMLDialogElement,
  clientX: number,
  clientY: number
) => {
  const bounds = dialog.getBoundingClientRect();
  return clientX < bounds.left
    || clientX > bounds.right
    || clientY < bounds.top
    || clientY > bounds.bottom;
};

export default function Modal({
  isOpen,
  title,
  description,
  children,
  actions,
  onClose,
  size = 'default',
  closeOnBackdrop = true,
  blocked = false,
  role = 'dialog',
  titleId,
  descriptionId,
  initialFocusRef
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const hasScrollLockRef = useRef(false);
  const backdropPointerDownRef = useRef(false);
  const generatedId = useId();
  const resolvedTitleId = titleId ?? `${generatedId}-title`;
  const resolvedDescriptionId = descriptionId ?? `${generatedId}-description`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    if (!dialog.open) {
      dialog.showModal();
    }
    acquireScrollLock();
    hasScrollLockRef.current = true;

    const focusFrame = window.requestAnimationFrame(() => {
      const requestedFocus = initialFocusRef?.current;
      const contentFocus = Array.from(
        contentRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []
      ).find(canReceiveFocus);
      const initialFocus = canReceiveFocus(requestedFocus)
        ? requestedFocus
        : contentFocus ?? closeButtonRef.current;
      initialFocus?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);

      if (dialog.open) {
        dialog.close();
      }
      if (hasScrollLockRef.current) {
        releaseScrollLock();
        hasScrollLockRef.current = false;
      }

      const previousFocus = previousFocusRef.current;
      previousFocusRef.current = null;
      if (canReceiveFocus(previousFocus)) {
        previousFocus.focus();
      }
    };
  }, [initialFocusRef, isOpen]);

  const requestClose = () => {
    if (!blocked) {
      onClose();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDialogElement>) => {
    backdropPointerDownRef.current = event.target === event.currentTarget
      && isOutsideDialog(event.currentTarget, event.clientX, event.clientY);
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    const clickedOutsidePanel = event.target === event.currentTarget
      && isOutsideDialog(event.currentTarget, event.clientX, event.clientY);
    const startedOutsidePanel = backdropPointerDownRef.current;
    backdropPointerDownRef.current = false;

    if (closeOnBackdrop && !blocked && startedOutsidePanel && clickedOutsidePanel) {
      requestClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={`modal modal-${size}`}
      role={role}
      aria-labelledby={resolvedTitleId}
      aria-describedby={description ? resolvedDescriptionId : undefined}
      aria-modal='true'
      aria-busy={blocked || undefined}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onPointerDown={handlePointerDown}
      onClick={handleBackdropClick}
    >
      <div className='modal-header'>
        <div>
          <h2 id={resolvedTitleId}>{title}</h2>
          {description && (
            <p id={resolvedDescriptionId} className='modal-description'>
              {description}
            </p>
          )}
        </div>
        <button
          ref={closeButtonRef}
          type='button'
          className='modal-close'
          onClick={requestClose}
          aria-label='Fechar'
          disabled={blocked}
        >
          ×
        </button>
      </div>

      <div ref={contentRef} className='modal-content'>
        {children}
      </div>

      {actions && <div className='modal-actions'>{actions}</div>}
    </dialog>
  );
}
