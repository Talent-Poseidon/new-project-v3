import Link from "next/link";
import { KamusUploadForm } from "@/components/admin/kamus-upload-form";

export const dynamic = "force-dynamic";

export default function KamusUploadPage() {
  return (
    <div>
      <nav data-testid="kamus-upload-page-nav" className="mb-6">
        <Link href="/admin/kamus" className="text-sm text-muted-foreground hover:underline">
          ← Back to Kamus
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Upload Kamus Template</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV template containing potensi and kompetensi entries.
          The system validates each row and stores items in the database.
        </p>
      </nav>
      <KamusUploadForm mode="upload" />
    </div>
  );
}
