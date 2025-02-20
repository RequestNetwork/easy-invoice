import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full p-6">
      <div className="max-w-7xl mx-auto flex justify-center items-center text-sm text-zinc-600">
        <div>
          © 2025 EasyInvoice. All rights reserved. Built by{" "}
          <Link href="https://request.network" className="underline">
            Request Network
          </Link>
        </div>
      </div>
    </footer>
  );
}
