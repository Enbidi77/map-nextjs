import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

export const glassButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:
          'bg-white/70 dark:bg-white/10 text-foreground border border-white/40 dark:border-white/15 shadow-sm backdrop-blur-xl hover:bg-white/90 dark:hover:bg-white/20 hover:border-white/60 dark:hover:border-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]',
        primary:
          'bg-primary/80 text-primary-foreground border border-primary/30 shadow-md backdrop-blur-xl hover:bg-primary/95 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]',
        accent:
          'bg-gradient-to-r from-blue-500/80 to-indigo-500/80 text-white border border-white/20 shadow-md backdrop-blur-xl hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]',
        subtle:
          'bg-white/30 dark:bg-white/5 text-foreground border border-white/20 dark:border-white/10 backdrop-blur-lg hover:bg-white/50 dark:hover:bg-white/10',
        ghost:
          'bg-transparent text-foreground border border-transparent hover:bg-white/30 dark:hover:bg-white/10 hover:border-white/20',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
        'icon-lg': 'h-11 w-11 p-0',
      },
      pill: {
        true: 'rounded-full',
        false: 'rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      pill: true,
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, pill = true, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(glassButtonVariants({ variant, size, pill, className }))}
        {...props}
      />
    );
  }
);
GlassButton.displayName = 'GlassButton';
