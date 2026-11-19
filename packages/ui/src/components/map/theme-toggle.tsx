import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from '../button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu.js';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'toggle' | 'dropdown' | 'glass';
  size?: 'default' | 'sm' | 'icon' | 'icon-sm';
  glass?: boolean;
}

export function ThemeToggle({
  className,
  variant = 'dropdown',
  size = 'icon',
  glass = false,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  const isGlass = glass || variant === 'glass';
  const buttonVariant = isGlass ? 'glass' : 'ghost';

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant={buttonVariant}
        size={size}
        className={cn('text-muted-foreground opacity-50', isGlass && 'rounded-full', className)}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  if (variant === 'toggle' || variant === 'glass') {
    const isDark = resolvedTheme === 'dark';
    return (
      <Button
        variant={isGlass ? 'glass-pill' : 'ghost'}
        size={size}
        className={cn('text-foreground transition-transform hover:scale-105', className)}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-all" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-500 transition-all" />
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isGlass ? 'glass-pill' : 'ghost'}
          size={size}
          className={cn('relative', className)}
          aria-label="Select theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[7rem]">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn('flex items-center gap-2', theme === 'light' && 'font-semibold text-primary')}
        >
          <Sun className="h-4 w-4 text-amber-500" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn('flex items-center gap-2', theme === 'dark' && 'font-semibold text-primary')}
        >
          <Moon className="h-4 w-4 text-indigo-400" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn('flex items-center gap-2', theme === 'system' && 'font-semibold text-primary')}
        >
          <Laptop className="h-4 w-4 text-muted-foreground" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
