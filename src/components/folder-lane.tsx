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
    return (
      <div
        ref={(node) => setRef(folderId, node)}
        data-id={folderId}
        className="w-full h-full flex flex-col gap-4 p-2 border-2 border-accent/50 rounded-lg bg-background/30"
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
              <ImageCard image={image} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default is vertical scroll for main page
  return (
    <div
      ref={(node) => setRef(folderId, node)}
      data-id={folderId}
      className="w-full flex flex-col gap-4"
    >
      <h2 className="text-xl font-semibold text-accent pl-4 md:pl-0">
        {folder.name}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 -mb-4 snap-x snap-mandatory">
        {folder.images.map((image, index) => (
          <div
            key={image.id}
            ref={(node) => setRef(image.id, node)}
            data-id={image.id}
            className={cn(
                "w-[80vw] sm:w-[60vw] md:w-[40vw] lg:w-[30vw] h-auto aspect-[4/3] flex-shrink-0 snap-start",
                index === 0 && 'ml-4 md:ml-0' // Add margin to first item
            )}
          >
            <ImageCard image={image} fit="cover"/>
          </div>
        ))}
        <div className="flex-shrink-0 w-4 md:w-0" />
      </div>
    </div>
  );
}
