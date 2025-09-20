import { getGalleryItems } from "@/lib/gallery";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder } from "lucide-react";
import FolderLane from "@/components/folder-lane";

export const revalidate = 0;

export default async function GalleryPage() {
  const folders = await getGalleryItems({ type: 'folders' });

  return (
    <main className="container mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold mb-8 text-primary">Folders</h1>
      <div className="flex flex-col gap-12">
        {folders?.map((folder) => {
          if (folder.type === 'folder' && folder.images.length > 0) {
            return (
              <div key={folder.id}>
                 <Link href={`/gallery/${folder.name}`}>
                    <h2 className="text-2xl font-bold text-accent mb-4 hover:underline">
                      {folder.name} ({folder.images.length} {folder.images.length === 1 ? 'image' : 'images'})
                    </h2>
                 </Link>
                <Link href={`/gallery/${folder.name}`}>
                  <div className="w-full max-w-5xl mx-auto">
                      <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
                        {folder.images.map((image) => (
                          <div
                            key={image.id}
                            className="w-[80vw] md:w-[400px] aspect-video flex-shrink-0 snap-center rounded-lg overflow-hidden border-2 border-accent/20"
                          >
                             <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                  </div>
                </Link>
              </div>
            );
          }
          return null;
        })}
      </div>
    </main>
  );
}
