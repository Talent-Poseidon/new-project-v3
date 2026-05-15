"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface KamusItem {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string;
  behavioralIndicators: string;
}

export function KamusList() {
  const [items, setItems] = useState<KamusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/kamus")
      .then((r) => r.json())
      .then((data: KamusItem[]) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item: KamusItem) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !item.name.toLowerCase().includes(q) &&
          !item.code.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [items, search, typeFilter]);

  const handleDelete = async (item: KamusItem) => {
    setDeleteError(null);
    const res = await fetch(`/api/kamus/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteError(body.error || `Failed to delete (${res.status})`);
      return;
    }
    load();
  };

  return (
    <div data-testid="kamus-list-container">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          data-testid="kamus-search-input"
          placeholder="Search by name or code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex items-center gap-2 text-sm">
          <span>Type:</span>
          <button
            type="button"
            data-testid="kamus-filter-all"
            onClick={() => setTypeFilter("all")}
            className={`rounded-md border px-3 py-1 ${typeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-background"}`}
          >
            All
          </button>
          <button
            type="button"
            data-testid="kamus-filter-potensi"
            onClick={() => setTypeFilter("potensi")}
            className={`rounded-md border px-3 py-1 ${typeFilter === "potensi" ? "bg-primary text-primary-foreground" : "bg-background"}`}
          >
            Potensi
          </button>
          <button
            type="button"
            data-testid="kamus-filter-kompetensi"
            onClick={() => setTypeFilter("kompetensi")}
            className={`rounded-md border px-3 py-1 ${typeFilter === "kompetensi" ? "bg-primary text-primary-foreground" : "bg-background"}`}
          >
            Kompetensi
          </button>
        </div>
      </div>

      {deleteError && (
        <div
          data-testid="kamus-delete-error-alert"
          className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {deleteError}
        </div>
      )}

      {loading ? (
        <p data-testid="kamus-list-loading" className="text-sm text-muted-foreground">
          Loading...
        </p>
      ) : filtered.length === 0 ? (
        <p data-testid="kamus-list-empty" className="text-sm text-muted-foreground">
          No kamus items found.
        </p>
      ) : (
        <ul data-testid="kamus-list" className="divide-y divide-border rounded-md border border-border bg-card">
          {filtered.map((item: KamusItem) => (
            <li
              key={item.id}
              data-testid={`kamus-item-${item.code}`}
              className="flex items-start justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{item.code}</span>
                  <Badge variant={item.type === "potensi" ? "secondary" : "default"}>
                    {item.type}
                  </Badge>
                </div>
                <p className="mt-1 font-medium">{item.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Button
                variant="outline"
                data-testid={`kamus-delete-btn-${item.code}`}
                onClick={() => handleDelete(item)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
