/**
 * AlphabetNav — Brutalist alphabetical index rail
 *
 * Fixed position A-Z navigation for list views.
 * Shows current position with aggressive highlight animation.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

const ALPHABET = ['#', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

interface AlphabetNavProps {
  /** Currently visible letter */
  activeLetter: string | null;
  /** Available letters that have content */
  availableLetters: Set<string>;
  /** Callback when a letter is clicked */
  onLetterClick: (letter: string) => void;
}

export function AlphabetNav({ activeLetter, availableLetters, onLetterClick }: AlphabetNavProps) {
  const [isHovering, setIsHovering] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Auto-scroll track to keep active letter visible (for mobile horizontal layout)
  useEffect(() => {
    if (!activeLetter || !trackRef.current) return;

    const activeButton = letterRefs.current.get(activeLetter);
    if (!activeButton) return;

    const track = trackRef.current;
    const buttonRect = activeButton.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();

    // Calculate scroll position to center the active letter
    const buttonCenter = activeButton.offsetLeft + buttonRect.width / 2;
    const trackCenter = trackRect.width / 2;
    const scrollTarget = buttonCenter - trackCenter;

    track.scrollTo({
      left: scrollTarget,
      behavior: 'smooth',
    });
  }, [activeLetter]);

  return (
    <nav
      ref={navRef}
      className="alphabet-nav-brutal"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-label="Alphabetical navigation"
    >
      <div className="alphabet-nav-track" ref={trackRef}>
        {ALPHABET.map((letter) => {
          const isAvailable = availableLetters.has(letter);
          const isActive = activeLetter === letter;

          return (
            <button
              key={letter}
              ref={(el) => {
                if (el) letterRefs.current.set(letter, el);
              }}
              className={`alphabet-nav-letter ${isActive ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
              onClick={() => isAvailable && onLetterClick(letter)}
              disabled={!isAvailable}
              aria-label={`Jump to ${letter === '#' ? 'numbers' : letter}`}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className="alphabet-nav-letter-text">{letter}</span>
              {isActive && <span className="alphabet-nav-indicator" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* Active letter callout - shows when hovering or scrolling */}
      {activeLetter && (isHovering || true) && (
        <div className="alphabet-nav-callout" aria-hidden="true">
          {activeLetter}
        </div>
      )}
    </nav>
  );
}

export interface AlphabetListItem {
  id: string;
  title: string;
}

interface AlphabetListProps<T extends AlphabetListItem> {
  /** Items to display, will be sorted alphabetically */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Class name for the list container */
  className?: string;
}

/**
 * Get the letter group for a title
 * Numbers and special chars go to #
 */
function getLetterGroup(title: string): string {
  const firstChar = title.trim().charAt(0).toUpperCase();
  if (/[A-Z]/.test(firstChar)) {
    return firstChar;
  }
  return '#';
}

/**
 * Sort items alphabetically by title
 * Numbers/special chars come first (#), then A-Z
 */
function sortAlphabetically<T extends AlphabetListItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();

    // Handle "The" prefix - sort by word after "The"
    const aSort = aTitle.startsWith('the ') ? aTitle.slice(4) : aTitle;
    const bSort = bTitle.startsWith('the ') ? bTitle.slice(4) : bTitle;

    // Numbers/special chars should come first
    const aIsLetter = /^[a-z]/.test(aSort);
    const bIsLetter = /^[a-z]/.test(bSort);

    if (!aIsLetter && bIsLetter) return -1;
    if (aIsLetter && !bIsLetter) return 1;

    return aSort.localeCompare(bSort);
  });
}

/**
 * Group items by their first letter
 */
function groupByLetter<T extends AlphabetListItem>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    // Handle "The" prefix for grouping too
    const title = item.title.toLowerCase();
    const sortTitle = title.startsWith('the ') ? item.title.slice(4) : item.title;
    const letter = getLetterGroup(sortTitle);

    if (!groups.has(letter)) {
      groups.set(letter, []);
    }
    groups.get(letter)!.push(item);
  }

  return groups;
}

export function AlphabetList<T extends AlphabetListItem>({
  items,
  renderItem,
  className = '',
}: AlphabetListProps<T>) {
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Sort and group items
  const sortedItems = sortAlphabetically(items);
  const groupedItems = groupByLetter(sortedItems);
  const availableLetters = new Set(groupedItems.keys());

  // Get first available letter
  const firstLetter = ALPHABET.find((l) => availableLetters.has(l)) || null;

  // Single scroll handler - find which section is at the reference point
  useEffect(() => {
    const REFERENCE_POINT = 200; // px from top of viewport

    const updateActiveLetter = () => {
      let bestLetter: string | null = null;

      // Find the section whose top is closest to (but above) the reference point
      sectionRefs.current.forEach((el, letter) => {
        const rect = el.getBoundingClientRect();
        // Section has scrolled past or is at the reference point
        if (rect.top <= REFERENCE_POINT) {
          bestLetter = letter;
        }
      });

      // Fallback to first letter if nothing has scrolled past yet
      setActiveLetter(bestLetter || firstLetter);
    };

    // Initial calculation
    updateActiveLetter();

    // Throttle with RAF for smooth performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveLetter();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [firstLetter]);

  // Handle letter click - scroll to section
  const handleLetterClick = useCallback((letter: string) => {
    const element = sectionRefs.current.get(letter);
    if (element) {
      const headerOffset = 180;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <div className={`alphabet-list-container ${className}`}>
      <div className="alphabet-list-content">
        {ALPHABET.map((letter) => {
          const letterItems = groupedItems.get(letter);
          if (!letterItems || letterItems.length === 0) return null;

          return (
            <div
              key={letter}
              ref={(el) => {
                if (el) sectionRefs.current.set(letter, el);
              }}
              className="alphabet-list-section"
              data-letter={letter}
            >
              <div className="alphabet-list-header">
                <span className="alphabet-list-letter">{letter}</span>
                <span className="alphabet-list-count">{letterItems.length}</span>
                <div className="alphabet-list-line" aria-hidden="true" />
              </div>
              <div className="alphabet-list-items">
                {letterItems.map((item, index) => renderItem(item, index))}
              </div>
            </div>
          );
        })}
      </div>

      <AlphabetNav
        activeLetter={activeLetter}
        availableLetters={availableLetters}
        onLetterClick={handleLetterClick}
      />
    </div>
  );
}
