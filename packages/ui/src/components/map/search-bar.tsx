import * as React from 'react';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
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
  showSubmitButton?: boolean;
  rightSlot?: React.ReactNode;
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      className,
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
      showSubmitButton = true,
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

    return (
      <div
        className={cn(
          'group relative flex w-full items-center rounded-xl border border-border/70 bg-background/90 px-3 py-1.5 shadow-md backdrop-blur-md transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
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
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-90"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Submit / Search Action Button */}
        {value && onSearch && showSubmitButton && (
          <button
            type="button"
            onClick={() => onSearch(value)}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
            aria-label="Submit search"
            title="Search"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Shortcut Badge when empty */}
        {!value && shortcut && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            {shortcut}
          </kbd>
        )}

        {/* Custom Right Slot */}
        {rightSlot && <div className="ml-1.5 flex items-center">{rightSlot}</div>}
      </div>
    );
  }
);
SearchBar.displayName = 'SearchBar';
