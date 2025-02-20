import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full p-6" aria-label="Site footer">
      <div className="max-w-7xl mx-auto flex justify-center items-center text-sm text-zinc-600">
        <div>
          © {new Date().getFullYear()} EasyInvoice. All rights reserved. Built
          by{" "}
          <Link href="https://request.network" className="underline">
            Request Network
          </Link>
        </div>
      </div>
    </footer>
  );
}
