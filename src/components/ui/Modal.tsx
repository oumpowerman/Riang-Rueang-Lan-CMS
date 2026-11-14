import React from 'react';
import { BaseModal } from './BaseModal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  headerRight?: React.ReactNode;
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
  badge,
  headerRight,
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
      badge={badge}
      headerRight={headerRight}
      maxWidthClass={maxWidthClass}
      headerContent={headerContent}
      bodyClassName="p-3.5 sm:p-5 bg-white"
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
