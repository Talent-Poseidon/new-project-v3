import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KamusList } from "@/components/admin/kamus-list";

export const dynamic = "force-dynamic";

export default function KamusViewPage() {
  return (
    <div>
      <nav data-testid="kamus-page-nav" className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kamus Potensi &amp; Kompetensi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All submitted kamus items. Search and filter by type.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/kamus/upload">
            <Button data-testid="kamus-upload-link">Upload Template</Button>
          </Link>
          <Link href="/admin/kamus/update">
            <Button variant="outline" data-testid="kamus-update-link">
              Update via Re-upload
            </Button>
          </Link>
        </div>
      </nav>
      <KamusList />
    </div>
  );
}
