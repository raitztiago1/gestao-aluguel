'use client';

import { badgeClassForStatus, labelStatusContrato, labelStatusSala } from '../lib/labels';

type StatusBadgeProps = {
  kind: 'contrato' | 'sala';
  status?: string | null;
};

export default function StatusBadge({ kind, status }: StatusBadgeProps) {
  const label = kind === 'contrato' ? labelStatusContrato(status) : labelStatusSala(status);
  return <span className={badgeClassForStatus(status)}>{label}</span>;
}
