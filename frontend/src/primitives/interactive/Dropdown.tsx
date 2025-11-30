/**
 * Dropdown — Select dropdown primitive
 *
 * Hard-edged dropdown menu for selection.
 * Supports search/filter functionality.
 */

import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  renderOption?: (option: DropdownOption) => ReactNode;
}

const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select...',
      disabled = false,
      searchable = false,
      searchPlaceholder = 'Search...',
      emptyMessage = 'No options found',
      renderOption,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase())
        )
      : options;

    const handleToggle = useCallback(() => {
      if (!disabled) {
        setIsOpen((prev) => !prev);
        if (!isOpen) {
          setSearch('');
        }
      }
    }, [disabled, isOpen]);

    const handleSelect = useCallback(
      (optionValue: string) => {
        onChange?.(optionValue);
        setIsOpen(false);
        setSearch('');
      },
      [onChange]
    );

    const handleClickOutside = useCallback((e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }, []);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
          setSearch('');
        }
      },
      []
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        if (searchable && inputRef.current) {
          inputRef.current.focus();
        }
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen, handleClickOutside, handleKeyDown, searchable]);

    const classes = clsx(
      'dropdown-brutal',
      isOpen && 'dropdown-brutal-open',
      disabled && 'dropdown-brutal-disabled',
      className
    );

    return (
      <div ref={containerRef} className={classes} {...props}>
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className="dropdown-brutal-trigger"
          onClick={handleToggle}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="dropdown-brutal-value">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="dropdown-brutal-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>

        {isOpen && (
          <div className="dropdown-brutal-menu" role="listbox">
            {searchable && (
              <div className="dropdown-brutal-search">
                <input
                  ref={inputRef}
                  type="text"
                  className="input-brutal dropdown-brutal-search-input"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
            <div className="dropdown-brutal-options">
              {filteredOptions.length === 0 ? (
                <div className="dropdown-brutal-empty">{emptyMessage}</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={clsx(
                      'dropdown-brutal-option',
                      option.value === value && 'dropdown-brutal-option-selected',
                      option.disabled && 'dropdown-brutal-option-disabled'
                    )}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {renderOption ? renderOption(option) : option.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export { Dropdown };
