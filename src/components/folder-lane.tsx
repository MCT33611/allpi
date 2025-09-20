
"use client";
import type { Folder } from "@/lib/gallery";
import ImageCard from "./image-card";
import { useRef, useState } from "react";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    e.currentTarget.style.cursor = 'grabbing';
    e.currentTarget.style.userSelect = 'none';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.style.cursor = 'grab';
    e.currentTarget.style.userSelect = 'auto';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.style.cursor = 'grab';
    e.currentTarget.style.userSelect = 'auto';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // The multiplier increases scroll speed
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };


  if (scrollDirection === "horizontal") {
    // This is the view inside the full-screen horizontal carousel
    return (
      <div
        ref={(node) => setRef(folderId, node)}
        data-id={folderId}
        className="w-full h-full flex flex-col gap-4 p-1 border-2 border-accent/50 rounded-lg bg-background/30"
      >
        <h2 className="text-xl font-semibold text-accent text-center shrink-0">
          {folder.name}
        </h2>
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 snap-y snap-mandatory min-h-0 hide-scrollbar">
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
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={cn(
            "w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar",
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
      >
        <div className="flex w-max">
          {folder.images.map((image) => (
            <div
              key={image.id}
              ref={(node) => setRef(image.id, node)}
              data-id={image.id}
              className="w-screen md:w-[calc(1024px-2rem)] h-auto aspect-[4/3] flex-shrink-0 snap-center px-4 md:px-0"
            >
              <ImageCard image={image} fit="contain" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
