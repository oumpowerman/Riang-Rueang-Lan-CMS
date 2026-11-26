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
  heightClass?: string;
  bodyClassName?: string;
  headerContent?: React.ReactNode;
  closeOnEsc?: boolean;
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
  heightClass,
  bodyClassName = 'p-3 sm:p-4 bg-white',
  headerContent,
  closeOnEsc = true,
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
      heightClass={heightClass}
      headerContent={headerContent}
      closeOnEsc={closeOnEsc}
      bodyClassName={bodyClassName}
      footer={footer}
    >
      {children}
    </BaseModal>
  );
};
