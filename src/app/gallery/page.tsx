import { getGalleryItems } from "@/lib/gallery";
import Link from "next/link";
import { Images } from "lucide-react";
import Header from "@/components/header";
import ImageCard from "@/components/image-card";

export const revalidate = 0;

export default async function GalleryPage() {
  const folders = await getGalleryItems({ type: 'folders' });

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-8 text-primary">Gallery</h1>
        <div className="flex flex-col gap-12">
          {folders?.map((folder) => {
            if (folder.type === 'folder' && folder.images.length > 0) {
              return (
                <div key={folder.id} className="w-full max-w-5xl mx-auto">
                  <Link href={`/gallery/${folder.name}`}>
                      <h2 className="text-2xl font-bold text-accent mb-4 hover:underline">
                        {folder.name}
                      </h2>
                  </Link>
                  <Link href={`/gallery/${folder.name}`} className="block relative group">
                    <div className="w-full overflow-x-auto hide-scrollbar snap-x snap-mandatory">
                        <div className="flex w-max gap-4">
                          {folder.images.map((image, index) => (
                            <div
                              key={image.id}
                              className="w-[calc(100vw-2rem)] max-w-5xl aspect-[4/3] flex-shrink-0 snap-center"
                            >
                              <ImageCard image={image} fit="contain" className="h-full w-full" />
                              {index === 0 && (
                                <div className="absolute top-0 right-0 w-0 h-0 border-t-[60px] border-t-accent/80 border-l-[60px] border-l-transparent group-hover:border-t-accent transition-colors">
                                  <div className="absolute -top-14 right-1 text-accent-foreground flex flex-col items-center">
                                    <Images className="w-5 h-5" />
                                    <span className="text-xs font-bold">{folder.images.length}</span>
                                  </div>
                                </div>
                              )}
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
    </>
  );
}
