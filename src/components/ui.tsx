/** Pawgress component library. Every visual decision comes from tokens.css. */
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { petPicture, type FaceKind } from '../art/petArt';
import type { AnimalId, Mood, Stage } from '../engine/types';
import { Icon, type IconName } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'celebrate';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  /** Small trailing badge, e.g. a treat cost. */
  badge?: ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', icon, badge, children, className = '', ...rest }: ButtonProps) {
  return (
    <button className={`btn btn--${variant} btn--${size} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 18 : 20} />}
      {children && <span>{children}</span>}
      {badge !== undefined && <span className="btn__badge">{badge}</span>}
    </button>
  );
}

export function IconButton({ icon, label, ...rest }: { icon: IconName; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="icon-btn" aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={20} />
    </button>
  );
}

export function Chip({ tone = 'plain', icon, children }: { tone?: 'plain' | Mood | 'treat'; icon?: IconName; children: ReactNode }) {
  return (
    <span className={`chip chip--${tone}`}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </span>
  );
}

/** Count progress for a habit: one dot per check-in toward the daily target. */
export function ProgressDots({ done, target }: { done: number; target: number }) {
  if (target > 10) {
    return (
      <span className="meter" aria-hidden="true">
        <span className="meter__fill" style={{ width: `${Math.min(1, done / target) * 100}%` }} />
      </span>
    );
  }
  return (
    <span className="dots" aria-hidden="true">
      {Array.from({ length: target }, (_, i) => (
        <i key={i} className={i < done ? 'on' : ''} />
      ))}
    </span>
  );
}

export function Meter({ value, label }: { value: number; label: string }) {
  return (
    <span className="meter" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <span className="meter__fill" style={{ width: `${Math.min(1, Math.max(0, value)) * 100}%` }} />
    </span>
  );
}

/** A static drawing of a pet, for pickers and the scrapbook. */
export function PetPicture({ animal, mood, stage, face, size = 120 }: { animal: AnimalId; mood: Mood; stage?: Stage; face?: FaceKind; size?: number }) {
  return <span className="pet-picture" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: petPicture(animal, { mood, stage, face }) }} />;
}

/** A modal sheet: slides up on phones, centered on wide screens. Closes on Escape. */
export function Sheet({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet ${wide ? 'sheet--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <header className="sheet__head">
          <h2 id={titleId}>{title}</h2>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </header>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {aside}
    </div>
  );
}
