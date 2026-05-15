import Link from "next/link";
import { KamusUploadForm } from "@/components/admin/kamus-upload-form";

export const dynamic = "force-dynamic";

export default function KamusUpdatePage() {
  return (
    <div>
      <nav data-testid="kamus-update-page-nav" className="mb-6">
        <Link href="/admin/kamus" className="text-sm text-muted-foreground hover:underline">
          ← Back to Kamus
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Update Kamus (Preview)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an updated template to preview new, changed, and removed items
          before committing. Once you confirm, go to the upload page to apply.
        </p>
      </nav>
      <KamusUploadForm mode="preview" />
    </div>
  );
}
