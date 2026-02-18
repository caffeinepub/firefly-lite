import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import LoginScreen from './components/auth/LoginScreen';
import AuthGate from './components/auth/AuthGate';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import AccountDetailPage from './pages/AccountDetailPage';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import BankConnectionsPage from './pages/BankConnectionsPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceFormPage from './pages/InvoiceFormPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import ReportsPage from './pages/ReportsPage';
import ReportFormPage from './pages/ReportFormPage';
import ReportDetailPage from './pages/ReportDetailPage';
import SettingsPage from './pages/SettingsPage';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

function Layout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounts',
  component: AccountsPage,
});

const accountDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounts/$accountId',
  component: AccountDetailPage,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transactions',
  component: TransactionsPage,
});

const categoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/categories',
  component: CategoriesPage,
});

const budgetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/budgets',
  component: BudgetsPage,
});

const bankConnectionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bank-connections',
  component: BankConnectionsPage,
});

const invoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invoices',
  component: InvoicesPage,
});

const invoiceNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invoices/new',
  component: InvoiceFormPage,
});

const invoiceDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invoices/$invoiceId',
  component: InvoiceDetailPage,
});

const invoiceEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invoices/$invoiceId/edit',
  component: InvoiceFormPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
});

const reportNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports/new',
  component: ReportFormPage,
});

const reportDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports/$reportId',
  component: ReportDetailPage,
});

const reportEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports/$reportId/edit',
  component: ReportFormPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  accountsRoute,
  accountDetailRoute,
  transactionsRoute,
  categoriesRoute,
  budgetsRoute,
  bankConnectionsRoute,
  invoicesRoute,
  invoiceNewRoute,
  invoiceDetailRoute,
  invoiceEditRoute,
  reportsRoute,
  reportNewRoute,
  reportDetailRoute,
  reportEditRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthGate>
        <RouterProvider router={router} />
        <Toaster />
      </AuthGate>
    </ThemeProvider>
  );
}
