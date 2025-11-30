/**
 * AppLayout — Main application layout
 *
 * Wraps all pages with navigation and theme provider.
 * Full-bleed brutalist container.
 */

import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Stack, Text, Film, TV, GridIcon, Arrow } from '../primitives';
import { NavBar, type NavItem } from '../components/nav';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';

function AppLayoutInner({ children }: { children?: ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();

  // Fetch libraries for nav
  const { data: librariesData } = useQuery({
    queryKey: ['libraries'],
    queryFn: () => apiClient.getLibraries(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const libraries = librariesData?.libraries || [];

  // Build nav items from libraries
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: <GridIcon size="sm" /> },
    ...libraries.map((lib) => ({
      label: lib.title.toUpperCase(),
      href: `/library/${encodeURIComponent(lib.title)}`,
      icon: lib.type === 'movie' ? <Film size="sm" /> : <TV size="sm" />,
    })),
  ];

  const userActions = user ? (
    <Stack direction="row" align="center" gap={2}>
      <Text variant="caption" color="secondary" className="nav-username">
        {user.username}
      </Text>
      <button
        onClick={logout}
        className="nav-brutal-theme-toggle"
        aria-label="Logout"
      >
        <Arrow size="sm" />
      </button>
    </Stack>
  ) : null;

  return (
    <Box minHeight="screen" bg="primary">
      <NavBar items={navItems} actions={userActions} />
      <Box as="main" className="app-main">
        {children || <Outlet />}
      </Box>
    </Box>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  return (
    <ThemeProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </ThemeProvider>
  );
}
