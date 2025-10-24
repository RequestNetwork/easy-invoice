import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full p-6 mt-auto" aria-label="Site footer">
      <div className="max-w-7xl mx-auto flex justify-center items-center text-sm text-muted-foreground bg-transparent">
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
