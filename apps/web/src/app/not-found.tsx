import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground">
      <h2 className="text-xl font-bold">Page Not Found</h2>
      <p className="mt-2 text-xs text-muted-foreground">Could not find requested resource.</p>
      <Link
        href="/"
        className="mt-4 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        Return Home
      </Link>
    </div>
  );
}
