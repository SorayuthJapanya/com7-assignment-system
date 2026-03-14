import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-muted-foreground mt-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. 
            The page might have been removed or is temporarily unavailable.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Go to Dashboard
          </Link>
          
          <div className="text-sm text-muted-foreground">
            or{" "}
            <Link 
              href="/login" 
              className="font-medium text-primary hover:underline"
            >
              sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
