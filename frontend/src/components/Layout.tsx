import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { GettingStartedCard } from '@/components/GettingStartedCard';
import { cn } from '@/lib/utils';

function ThemeToggle() {
  const { toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 shrink-0 relative"
      aria-label="Toggle light or dark theme"
    >
      <Moon className="h-4 w-4 block dark:hidden" aria-hidden />
      <Sun className="h-4 w-4 hidden dark:block" aria-hidden />
    </Button>
  );
}

// Primary: core workflow (most used). Secondary: setup/admin (less frequent).
const navPrimary = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/categories', label: 'Categories' },
];
const navSecondary = [
  { to: '/import', label: 'Import' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/settings', label: 'Settings' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="absolute left-0 top-0 z-[100] h-px w-px overflow-hidden p-0 [-webkit-clip-path:inset(50%)] [clip-path:inset(50%)] focus:left-4 focus:top-4 focus:h-auto focus:w-auto focus:overflow-visible focus:p-4 focus:[clip-path:none] focus:[-webkit-clip-path:none] focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <header className="shrink-0 border-b border-border bg-card text-card-foreground">
        <div className="flex h-14 items-center gap-2 px-4 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 shrink-0"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
          <Link
            to="/"
            className="inline-flex items-baseline shrink-0 -translate-y-2 text-[var(--brand-piggy)] hover:text-[var(--brand-piggy)]"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="text-3xl font-semibold">Pigg</span>
            <span
              className="font-piggy-tail text-5xl font-bold leading-none"
              style={{ marginBottom: '-0.2em' }}
            >
              y
            </span>
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="text-muted-foreground text-sm truncate max-w-[120px] sm:max-w-[180px]">
              {user?.username}
            </span>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="border-border bg-transparent text-card-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Logout
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav
            className="flex flex-col border-t border-border px-4 py-3 md:hidden"
            aria-label="Main"
          >
            <div className="flex flex-col gap-1">
              {navPrimary.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    location.pathname === to
                      ? 'border border-primary/55 bg-primary/35 text-primary-foreground hover:bg-primary/45'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div
              className="my-2 border-t border-border"
              role="presentation"
            />
            <div className="flex flex-col gap-1">
              {navSecondary.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    location.pathname === to
                      ? 'border border-primary/55 bg-primary/35 text-primary-foreground hover:bg-primary/45'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      <nav
        className="sticky top-0 z-20 shrink-0 border-b border-border bg-card px-4 py-2 shadow-[0_1px_0_0_var(--border)] text-card-foreground hidden md:flex flex-wrap items-center gap-2"
        aria-label="Main"
      >
        <div className="flex flex-wrap gap-2">
          {navPrimary.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === to
                  ? 'border border-primary/55 bg-primary/35 text-primary-foreground hover:bg-primary/45'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {label}
            </Link>
          ))}
        </div>
        <span className="h-5 w-px shrink-0 bg-border" aria-hidden />
        <div className="flex flex-wrap gap-2">
          {navSecondary.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === to
                  ? 'border border-primary/55 bg-primary/35 text-primary-foreground hover:bg-primary/45'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <main
        id="main"
        className="flex-1 min-w-0 overflow-x-hidden pt-4 px-3 pb-3 sm:pt-5 sm:px-4 sm:pb-4 text-foreground"
      >
        <GettingStartedCard />
        <Outlet />
      </main>
    </div>
  );
}
