// Dashboard layout — the sidebar + feature switching now lives entirely
// inside (dashboard)/page.tsx as a single-page client component.
// This layout is kept minimal so Clerk auth context passes through cleanly.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
