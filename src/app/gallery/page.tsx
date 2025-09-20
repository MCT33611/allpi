import { getGalleryItems } from "@/lib/gallery";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder } from "lucide-react";

export const revalidate = 0;

export default async function GalleryPage() {
  const folders = await getGalleryItems({ type: 'folders' });

  return (
    <main className="container mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold mb-8 text-primary">Folders</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {folders?.map((folder) => {
          if (folder.type === 'folder') {
            return (
              <Link href={`/gallery/${folder.name}`} key={folder.id}>
                <Card className="bg-card hover:bg-accent/10 transition-colors border-accent/20 hover:border-accent/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {folder.name}
                    </CardTitle>
                    <Folder className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {folder.images.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {folder.images.length === 1 ? 'image' : 'images'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          }
          return null;
        })}
      </div>
    </main>
  );
}
