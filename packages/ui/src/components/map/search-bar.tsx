import * as React from 'react';
import { Search, X, Loader2, Navigation } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface SearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
  shortcut?: string;
  showDirectionsButton?: boolean;
  onDirectionsClick?: () => void;
  rightSlot?: React.ReactNode;
  variant?: 'default' | 'glass';
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      className,
      variant = 'default',
      value: controlledValue,
      defaultValue = '',
      onChange,
      onSearch,
      onClear,
      isLoading = false,
      shortcut = '⌘K',
      placeholder = 'Search places, coordinates, or addresses...',
      showDirectionsButton = false,
      onDirectionsClick,
      rightSlot,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Combine external ref and internal ref
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      if (controlledValue === undefined) {
        setUncontrolledValue(next);
      }
      onChange?.(next);
    };

    const handleClear = () => {
      if (controlledValue === undefined) {
        setUncontrolledValue('');
      }
      onChange?.('');
      onClear?.();
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSearch?.(value);
      } else if (e.key === 'Escape') {
        if (value) {
          e.preventDefault();
          handleClear();
        } else {
          inputRef.current?.blur();
        }
      }
      onKeyDown?.(e);
    };

    const isGlass = variant === 'glass';

    return (
      <div
        className={cn(
          'group relative flex w-full items-center transition-all duration-200',
          isGlass
            ? 'rounded-2xl border border-white/40 dark:border-white/15 bg-white/75 dark:bg-zinc-900/70 px-4 py-2 shadow-xl shadow-black/5 dark:shadow-black/25 backdrop-blur-2xl focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15'
            : 'rounded-xl border border-border/70 bg-background/90 px-3 py-1.5 shadow-md backdrop-blur-md focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
          className
        )}
      >
        {/* Leading Search Icon / Loading Spinner */}
        <div className="mr-2 flex items-center text-muted-foreground transition-colors group-focus-within:text-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'mr-1.5 rounded-full p-1 text-muted-foreground transition-colors active:scale-90',
              isGlass ? 'hover:bg-white/40 dark:hover:bg-white/10 hover:text-foreground' : 'hover:bg-muted hover:text-foreground'
            )}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Shortcut Badge */}
        {!value && shortcut && (
          <kbd
            className={cn(
              'hidden sm:inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground',
              isGlass
                ? 'border border-white/30 dark:border-white/10 bg-white/40 dark:bg-white/10'
                : 'border border-border/80 bg-muted/60'
            )}
          >
            {shortcut}
          </kbd>
        )}

        {/* Directions Button shortcut */}
        {showDirectionsButton && (
          <button
            type="button"
            onClick={onDirectionsClick}
            className={cn(
              'ml-1.5 flex h-7 w-7 items-center justify-center transition-colors active:scale-95',
              isGlass
                ? 'rounded-xl bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 shadow-sm'
                : 'rounded-lg bg-primary/10 text-primary hover:bg-primary/20'
            )}
            title="Directions"
            aria-label="Directions"
          >
            <Navigation className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Custom Right Slot */}
        {rightSlot && <div className="ml-1.5 flex items-center">{rightSlot}</div>}
      </div>
    );
  }
);
SearchBar.displayName = 'SearchBar';
