/**
 * NavBar — Brutalist navigation header
 *
 * Thick bottom border. Asymmetric spacing.
 * Logo left, nav items center-ish, actions right.
 *
 * Mobile: Icons only, tap to expand labels
 */

import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Box, Stack, Text, EyeOpen, EyeClosed, Logo } from '../../primitives';
import { useTheme } from '../../contexts/ThemeContext';

export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface NavBarProps {
  items?: NavItem[];
  logo?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function NavBar({ items = [], logo, actions, className }: NavBarProps) {
  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNavClick = () => {
    // On mobile, toggle expanded state when clicking nav area
    // But allow navigation to still work
    setIsExpanded((prev) => !prev);
  };

  return (
    <Box
      as="header"
      className={clsx('nav-brutal-header', className)}
      borderBottom
    >
      <Stack direction="row" align="center" justify="between" fullWidth>
        {/* Logo */}
        <Link to="/" className="nav-brutal-logo">
          {logo || (
            <>
              <Logo size="lg" className="nav-brutal-logo-icon" />
              <Text as="span" variant="label" bold className="nav-brutal-logo-text">
                PLEX DUALSUB
              </Text>
            </>
          )}
        </Link>

        {/* Navigation Items */}
        <Box
          as="nav"
          className={clsx('nav-brutal-items', isExpanded && 'expanded')}
          onClick={handleNavClick}
        >
          <Stack direction="row" gap={0}>
            {items.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={clsx(
                    'nav-brutal-link',
                    isActive && 'nav-brutal-link-active'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.icon && <span className="nav-brutal-link-icon">{item.icon}</span>}
                  <span className="nav-brutal-link-text">{item.label}</span>
                </Link>
              );
            })}
          </Stack>
        </Box>

        {/* Actions (theme toggle, user menu, etc.) */}
        <Stack direction="row" align="center" gap={2} className="nav-brutal-actions">
          <button
            onClick={toggleTheme}
            className="nav-brutal-theme-toggle"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? <EyeOpen size="sm" /> : <EyeClosed size="sm" />}
          </button>
          {actions}
        </Stack>
      </Stack>
    </Box>
  );
}
