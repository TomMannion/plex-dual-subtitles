/**
 * Modal — Dialog primitive
 *
 * Hard-edged modal dialog with backdrop.
 * Click outside or press Escape to close.
 */

import {
  forwardRef,
  useEffect,
  useCallback,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  title?: string;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      children,
      className,
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      title,
      ...props
    },
    ref
  ) => {
    const handleEscape = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape) {
          onClose();
        }
      },
      [closeOnEscape, onClose]
    );

    const handleOverlayClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
          onClose();
        }
      },
      [closeOnOverlayClick, onClose]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'modal-brutal-sm',
      md: 'modal-brutal-md',
      lg: 'modal-brutal-lg',
      xl: 'modal-brutal-xl',
      full: 'modal-brutal-full',
    };

    const modal = (
      <div
        className="modal-brutal-overlay"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div
          ref={ref}
          className={clsx('modal-brutal', sizeClasses[size], className)}
          {...props}
        >
          {title && (
            <ModalHeader>
              <h2 id="modal-title" className="modal-brutal-title">
                {title}
              </h2>
              <button
                type="button"
                className="modal-brutal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                X
              </button>
            </ModalHeader>
          )}
          {children}
        </div>
      </div>
    );

    return createPortal(modal, document.body);
  }
);

Modal.displayName = 'Modal';

// Compound components
const ModalHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx('modal-brutal-header', className)} {...props}>
      {children}
    </div>
  )
);
ModalHeader.displayName = 'Modal.Header';

const ModalBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx('modal-brutal-body', className)} {...props}>
      {children}
    </div>
  )
);
ModalBody.displayName = 'Modal.Body';

const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx('modal-brutal-footer', className)} {...props}>
      {children}
    </div>
  )
);
ModalFooter.displayName = 'Modal.Footer';

export { Modal, ModalHeader, ModalBody, ModalFooter };
