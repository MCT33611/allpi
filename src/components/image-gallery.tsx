"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { GalleryItem } from "@/lib/gallery";
import ScrollToggle from "./scroll-toggle";
import { cn } from "@/lib/utils";
import ImageCard from "./image-card";
import FolderLane from "./folder-lane";
import { useSearchParams } from "next/navigation";

type ScrollDirection = "vertical" | "horizontal";

export default function ImageGallery({ items }: { items: GalleryItem[] }) {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>("vertical");
  const galleryRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const itemRefs = useRef(new Map<string, HTMLElement>());

  // Initial scroll to last seen or specified image
  useEffect(() => {
    const lastSeenId = localStorage.getItem("lastSeenImageId");
    const startImageId = searchParams.get("imageId") || lastSeenId;

    if (startImageId) {
      let attempts = 0;
      const maxAttempts = 100;
      const tryScroll = () => {
        const element = itemRefs.current.get(startImageId);
        if (element) {
          // 'auto' is instant, 'smooth' can be interrupted by user
          element.scrollIntoView({
            behavior: "auto",
            block: "center",
            inline: "center",
          });
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(tryScroll, 50); // Retry after a short delay
        }
      };
      // Delay to ensure layout is stable
      setTimeout(tryScroll, 100);
    }
  }, [searchParams, items]);

  // Intersection Observer to update last seen image
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const intersectingEntry = entries.find((e) => e.isIntersecting);
        if (intersectingEntry) {
          const imageId = intersectingEntry.target.getAttribute("data-id");
          if (imageId) {
            localStorage.setItem("lastSeenImageId", imageId);
            const newUrl = `${window.location.pathname}?imageId=${imageId}`;
            window.history.replaceState(
              { ...window.history.state, as: newUrl, url: newUrl },
              "",
              newUrl
            );
          }
        }
      },
      {
        root: galleryRef.current,
        // This margin creates a horizontal or vertical line in the middle of the viewport.
        // The element crossing this line is considered 'intersecting'.
        rootMargin: scrollDirection === "vertical" ? "-50% 0px -50% 0px" : "0px -50% 0px -50%",
        threshold: 0,
      }
    );

    const elements = Array.from(itemRefs.current.values());
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [items, scrollDirection]);

  // Callback ref to populate refs map
  const setItemRef = useCallback((id: string, node: HTMLElement | null) => {
    if (node) {
      itemRefs.current.set(id, node);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  return (
    <main className="bg-background text-primary h-screen w-screen overflow-hidden flex flex-col">
      <header className="absolute top-0 left-0 w-full p-4 z-50 bg-gradient-to-b from-background/80 to-transparent">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary tracking-widest">ALLPI</h1>
          <ScrollToggle
            scrollDirection={scrollDirection}
            setScrollDirection={setScrollDirection}
          />
        </div>
      </header>

      <div
        ref={galleryRef}
        className={cn(
          "flex-1 w-full h-full pt-20 scroll-smooth",
          scrollDirection === "vertical"
            ? "flex flex-col items-center gap-16 overflow-y-auto px-4"
            : "flex items-center gap-8 px-8 overflow-x-auto overflow-y-hidden"
        )}
      >
        {items.map((item, index) => {
          if (item.type === "folder") {
            return (
              <div
                key={item.id}
                className={cn(
                  "flex-shrink-0",
                  scrollDirection === "horizontal" && "h-[80vh]"
                )}
              >
                <FolderLane
                  folder={item}
                  setRef={setItemRef}
                  scrollDirection={scrollDirection}
                />
              </div>
            );
          }
          if (item.type === "image") {
            return (
              <div
                key={item.id}
                ref={(node) => setItemRef(item.id, node)}
                data-id={item.id}
                className={cn(
                  "flex-shrink-0 transition-all duration-300",
                  scrollDirection === "vertical"
                    ? "w-full max-w-5xl h-auto aspect-[4/3]"
                    : "h-[80vh] aspect-auto"
                )}
              >
                <ImageCard image={item} className="w-full h-full" priority={index < 3} />
              </div>
            );
          }
          return null;
        })}
        <div className="h-16 w-full flex-shrink-0" />
      </div>
    </main>
  );
}
