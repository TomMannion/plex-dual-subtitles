/**
 * App — Root application component
 *
 * Brutalist design system entry point.
 * Wraps everything with theme, auth, and query providers.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toaster';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts';
import { Dashboard } from './pages/Dashboard';
import { Shows } from './pages/Shows';
import { ShowDetail } from './pages/ShowDetail';
import { EpisodeDetail } from './pages/EpisodeDetail';
import { Movies } from './pages/Movies';
import { MovieDetail } from './pages/MovieDetail';
import { LibraryPage } from './pages/LibraryPage';
import { AuthCallback } from './pages/AuthCallback';
import './index.css';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Router>
              <Routes>
                {/* Auth callback route - outside ProtectedRoute for popup */}
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected routes with AppLayout */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/library/:libraryName" element={<LibraryPage />} />
                          <Route path="/shows" element={<Shows />} />
                          <Route path="/shows/:showId" element={<ShowDetail />} />
                          <Route path="/episodes/:episodeId" element={<EpisodeDetail />} />
                          <Route path="/movies" element={<Movies />} />
                          <Route path="/movies/:movieId" element={<MovieDetail />} />
                        </Routes>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
