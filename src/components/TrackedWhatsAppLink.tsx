'use client';

import { track } from '@vercel/analytics';
import type { ReactNode } from 'react';

interface Props {
  href: string;
  source: string;
  data?: Record<string, string | number | boolean | null>;
  className?: string;
  title?: string;
  children: ReactNode;
}

export default function TrackedWhatsAppLink({ href, source, data, className, title, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={title}
      onClick={() => track('whatsapp_click', { source, ...data })}
    >
      {children}
    </a>
  );
}
