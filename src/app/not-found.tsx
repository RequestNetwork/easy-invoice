import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Not Found
          </h2>
          <p className="text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
