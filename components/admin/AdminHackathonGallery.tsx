"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Eye, EyeOff } from "lucide-react";

interface GalleryProduct {
  id: string;
  team_id: string;
  team_name: string;
  product_name: string;
  problem_statement: string;
  tags: string[];
  is_published: boolean;
  created_at: string;
  demo_url: string | null;
  cover_image_url: string | null;
}

export function AdminHackathonGallery() {
  const [products, setProducts] = useState<GalleryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/hackathon/gallery")
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const togglePublish = async (product: GalleryProduct) => {
    setToggling(product.id);
    try {
      const res = await fetch(`/api/admin/hackathon/gallery/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !product.is_published }),
      });
      if (!res.ok) throw new Error("Failed");
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_published: !product.is_published } : p
        )
      );
    } catch {
      alert("Failed to update publish state");
    } finally {
      setToggling(null);
    }
  };

  const published = products.filter((p) => p.is_published).length;
  const pending = products.length - published;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Submissions</CardDescription>
            <CardTitle className="text-3xl">{products.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{published}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{pending}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gallery Submissions</CardTitle>
          <CardDescription>Review and publish team product submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No submissions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Publish</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium max-w-[180px]">
                      <p className="truncate">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{product.problem_statement}</p>
                    </TableCell>
                    <TableCell className="text-sm">{product.team_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {product.tags.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{product.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(product.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_published ? "default" : "outline"} className={product.is_published ? "bg-emerald-600" : ""}>
                        {product.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <a
                          href={`/hackathon/gallery/${product.team_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Preview gallery page"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        {product.demo_url && (
                          <a
                            href={product.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Demo URL"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={product.is_published ? "outline" : "default"}
                        onClick={() => togglePublish(product)}
                        disabled={toggling === product.id}
                        className="gap-1.5 text-xs"
                      >
                        {toggling === product.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : product.is_published ? (
                          <><EyeOff className="h-3 w-3" /> Unpublish</>
                        ) : (
                          <><Eye className="h-3 w-3" /> Publish</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
