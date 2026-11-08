import React from 'react';
import { BaseModal } from './BaseModal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-3xl',
  headerContent,
  children,
  footer,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidthClass={maxWidthClass}
      headerContent={headerContent}
      bodyClassName="p-6 bg-white"
      footer={
        footer ? (
          <div className="flex items-center justify-end gap-3">{footer}</div>
        ) : undefined
      }
    >
      {children}
    </BaseModal>
  );
};
