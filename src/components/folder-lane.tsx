
"use client";
import type { Folder } from "@/lib/gallery";
import ImageCard from "./image-card";
import { cn } from "@/lib/utils";

type FolderLaneProps = {
  folder: Folder;
  setRef: (id: string, node: HTMLElement | null) => void;
  scrollDirection: "vertical" | "horizontal";
};

export default function FolderLane({
  folder,
  setRef,
  scrollDirection,
}: FolderLaneProps) {
  const folderId = folder.images[0]?.id || folder.id;

  if (scrollDirection === "horizontal") {
    // This is the view inside the full-screen horizontal carousel
    return (
      <div
        ref={(node) => setRef(folderId, node)}
        data-id={folderId}
        className="w-full h-full flex flex-col gap-4 p-1 border-2 border-accent/50 rounded-lg bg-background/30"
      >
        <h2 className="text-xl font-semibold text-accent text-center">
          {folder.name}
        </h2>
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 snap-y snap-mandatory min-h-0">
          {folder.images.map((image) => (
            <div
              key={image.id}
              ref={(node) => setRef(image.id, node)}
              data-id={image.id}
              className="w-full h-auto aspect-[4/3] flex-shrink-0 snap-center"
            >
              <ImageCard image={image} fit="contain" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default is the single-image horizontal folder view on the main vertical page
  return (
    <div
      ref={(node) => setRef(folderId, node)}
      data-id={folderId}
      className="w-full flex flex-col gap-4"
    >
      <h2 className="text-xl font-semibold text-accent pl-4 md:pl-0">
        {folder.name}
      </h2>
      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
        {folder.images.map((image) => (
          <div
            key={image.id}
            ref={(node) => setRef(image.id, node)}
            data-id={image.id}
            className="w-full h-auto aspect-[4/3] flex-shrink-0 snap-start"
          >
            <ImageCard image={image} fit="contain"/>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper to hide scrollbars, you might need a CSS utility for this
// e.g., in your globals.css:
// .hide-scrollbar::-webkit-scrollbar { display: none; }
// .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
