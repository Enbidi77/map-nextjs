'use client';

import dynamic from 'next/dynamic';

const MapShell = dynamic(
  () => import('../components/MapShell').then((mod) => mod.MapShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
        <span className="mt-3 font-mono text-xs text-muted-foreground">
          Initializing Modern Maps...
        </span>
      </div>
    ),
  }
);

export default function HomePage() {
  return <MapShell />;
}
