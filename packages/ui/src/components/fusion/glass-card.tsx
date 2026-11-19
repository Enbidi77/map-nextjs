import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

export const glassCardVariants = cva(
  'relative overflow-hidden transition-all text-card-foreground',
  {
    variants: {
      variant: {
        default:
          'bg-white/70 dark:bg-zinc-900/60 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
        elevated:
          'bg-white/80 dark:bg-zinc-900/75 border border-white/40 dark:border-white/15 shadow-[0_16px_48px_0_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_0_rgba(0,0,0,0.5)]',
        subtle:
          'bg-white/40 dark:bg-zinc-900/35 border border-white/20 dark:border-white/5 shadow-sm',
        sunken:
          'bg-white/30 dark:bg-zinc-950/40 border border-white/10 dark:border-white/5 shadow-inner',
        interactive:
          'bg-white/70 dark:bg-zinc-900/60 border border-white/30 dark:border-white/10 shadow-md hover:bg-white/85 dark:hover:bg-zinc-900/80 hover:border-white/50 dark:hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer duration-200',
      },
      blur: {
        none: 'backdrop-blur-none',
        sm: 'backdrop-blur-sm',
        md: 'backdrop-blur-md',
        lg: 'backdrop-blur-lg',
        xl: 'backdrop-blur-xl',
        '2xl': 'backdrop-blur-2xl',
        '3xl': 'backdrop-blur-3xl',
      },
      radius: {
        none: 'rounded-none',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        '3xl': 'rounded-3xl',
        full: 'rounded-full',
      },
      glow: {
        none: '',
        soft: 'before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:bg-gradient-to-b before:from-white/25 before:to-transparent before:opacity-70 dark:before:from-white/10',
        neon: 'ring-1 ring-white/40 shadow-[0_0_25px_rgba(255,255,255,0.2)] dark:shadow-[0_0_25px_rgba(255,255,255,0.05)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      blur: '2xl',
      radius: '2xl',
      glow: 'soft',
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, blur, radius, glow, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, blur, radius, glow }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

export const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-5 sm:p-6', className)} {...props} />
));
GlassCardHeader.displayName = 'GlassCardHeader';

export const GlassCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-base sm:text-lg font-semibold leading-none tracking-tight text-foreground', className)}
    {...props}
  />
));
GlassCardTitle.displayName = 'GlassCardTitle';

export const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-xs sm:text-sm text-muted-foreground', className)} {...props} />
));
GlassCardDescription.displayName = 'GlassCardDescription';

export const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 sm:p-6 pt-0', className)} {...props} />
));
GlassCardContent.displayName = 'GlassCardContent';

export const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-5 sm:p-6 pt-0', className)} {...props} />
));
GlassCardFooter.displayName = 'GlassCardFooter';
