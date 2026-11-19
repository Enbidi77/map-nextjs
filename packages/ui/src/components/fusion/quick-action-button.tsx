import * as React from 'react';
import { cn } from '../../lib/utils.js';

export type QuickActionColor =
  | 'default'
  | 'primary'
  | 'emerald'
  | 'blue'
  | 'pink'
  | 'cyan'
  | 'amber';

const colorStyles: Record<
  QuickActionColor,
  {
    button: string;
    active: string;
    glow: string;
  }
> = {
  default: {
    button:
      'bg-white/70 dark:bg-zinc-800/60 border-white/40 dark:border-white/15 text-foreground hover:bg-white/90 dark:hover:bg-zinc-700/80 hover:border-white/60 dark:hover:border-white/30',
    active:
      'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 ring-2 ring-primary/30',
    glow: 'hover:shadow-[0_0_20px_rgba(255,255,255,0.35)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]',
  },
  primary: {
    button:
      'bg-primary/15 text-primary border-primary/30 hover:bg-primary/25 hover:border-primary/50',
    active:
      'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30 ring-2 ring-primary/40',
    glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]',
  },
  emerald: {
    button:
      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25',
    active:
      'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40',
    glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]',
  },
  blue: {
    button:
      'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/25',
    active:
      'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40',
    glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]',
  },
  pink: {
    button:
      'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30 hover:bg-pink-500/25',
    active:
      'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/30 ring-2 ring-pink-400/40',
    glow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.35)]',
  },
  cyan: {
    button:
      'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25',
    active:
      'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-500/30 ring-2 ring-cyan-400/40',
    glow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.35)]',
  },
  amber: {
    button:
      'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25',
    active:
      'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/40',
    glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]',
  },
};

const sizeStyles = {
  sm: {
    button: 'h-10 w-10 text-base',
    iconSize: 'h-4 w-4',
    text: 'text-[11px] max-w-[64px]',
  },
  default: {
    button: 'h-12 w-12 text-lg sm:h-13 sm:w-13',
    iconSize: 'h-5 w-5',
    text: 'text-xs max-w-[76px]',
  },
  lg: {
    button: 'h-14 w-14 text-xl sm:h-16 sm:w-16',
    iconSize: 'h-6 w-6',
    text: 'text-xs sm:text-sm max-w-[88px]',
  },
};

export interface QuickActionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string | number;
  color?: QuickActionColor;
  size?: 'sm' | 'default' | 'lg';
  buttonClassName?: string;
  labelClassName?: string;
}

export const QuickActionButton = React.forwardRef<HTMLButtonElement, QuickActionButtonProps>(
  (
    {
      icon,
      label,
      active = false,
      badge,
      color = 'default',
      size = 'default',
      className,
      buttonClassName,
      labelClassName,
      disabled,
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const colorTheme = colorStyles[color] || colorStyles.default;
    const sizeTheme = sizeStyles[size] || sizeStyles.default;

    return (
      <div
        className={cn(
          'group inline-flex flex-col items-center gap-1.5 focus:outline-none select-none',
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
      >
        <button
          ref={ref}
          type={type}
          disabled={disabled}
          onClick={onClick}
          className={cn(
            'relative flex items-center justify-center rounded-full border shadow-md backdrop-blur-xl transition-all duration-300',
            'group-hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            sizeTheme.button,
            active ? colorTheme.active : colorTheme.button,
            colorTheme.glow,
            buttonClassName
          )}
          aria-label={label}
          aria-pressed={active}
          {...props}
        >
          {icon}

          {badge !== undefined && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background shadow">
              {badge}
            </span>
          )}
        </button>

        <span
          className={cn(
            'font-medium text-foreground/80 group-hover:text-foreground text-center truncate transition-colors leading-tight',
            active && 'font-semibold text-foreground',
            sizeTheme.text,
            labelClassName
          )}
        >
          {label}
        </span>
      </div>
    );
  }
);
QuickActionButton.displayName = 'QuickActionButton';
