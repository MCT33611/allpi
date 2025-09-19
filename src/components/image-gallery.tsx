"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { GalleryItem } from "@/lib/gallery";
import ScrollToggle from "./scroll-toggle";
import { cn } from "@/lib/utils";
import ImageCard from "./image-card";
import FolderLane from "./folder-lane";
import { useSearchParams } from "next/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";

type ScrollDirection = "vertical" | "horizontal";

export default function ImageGallery({ items }: { items: GalleryItem[] }) {
  const [isClient, setIsClient] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>("vertical");
  const galleryRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const lastScrollX = useRef(0);

  const itemRefs = useRef(new Map<string, HTMLElement>());
  const carouselItemRefs = useRef(new Map<string, number>());
  items.forEach((item, index) => {
    carouselItemRefs.current.set(item.id, index);
    if(item.type === 'folder') {
      item.images.forEach(img => {
        carouselItemRefs.current.set(img.id, index);
      })
    }
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Scroll to initial image
  useEffect(() => {
    if (!isClient || !items.length) return;

    const startImageId = searchParams.get("imageId") || localStorage.getItem("lastSeenImageId");

    if (startImageId) {
        const index = carouselItemRefs.current.get(startImageId);
        if (typeof index === 'number') {
            if (scrollDirection === 'horizontal' && carouselApi) {
                carouselApi.scrollTo(index, true);
            } else {
                 let attempts = 0;
                const maxAttempts = 100;
                const tryScroll = () => {
                    const element = itemRefs.current.get(startImageId);
                    if (element) {
                        element.scrollIntoView({ behavior: "auto", block: "center" });
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(tryScroll, 50); // Retry after a short delay
                    }
                };
                setTimeout(tryScroll, 100);
            }
        }
    }
  }, [searchParams, items, carouselApi, scrollDirection, isClient]);


  // Carousel slide change handler
  useEffect(() => {
    if (!carouselApi || !isClient) return;

    const onSelect = (api: CarouselApi) => {
      const slideIndex = api.selectedScrollSnap();
      const currentItem = items[slideIndex];
      if (currentItem) {
        const imageId = currentItem.type === 'folder' ? (currentItem.images[0]?.id || currentItem.id) : currentItem.id;
        localStorage.setItem("lastSeenImageId", imageId);
        const newUrl = `${window.location.pathname}?imageId=${imageId}`;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
      }
    };

    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi, items, isClient]);


  // Intersection Observer for vertical scroll
  useEffect(() => {
    if (scrollDirection !== 'vertical' || !isClient) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersectingEntry = entries.find((e) => e.isIntersecting);
        if (intersectingEntry) {
          const imageId = intersectingEntry.target.getAttribute("data-id");
          if (imageId) {
            localStorage.setItem("lastSeenImageId", imageId);
            const newUrl = `${window.location.pathname}?imageId=${imageId}`;
            window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
          }
        }
      },
      {
        root: galleryRef.current,
        rootMargin: "-50% 0px -50% 0px",
        threshold: 0,
      }
    );

    const elements = Array.from(itemRefs.current.values());
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [items, scrollDirection, isClient]);

  // Header visibility on scroll
  useEffect(() => {
    if (!isClient) return;
    const handleScroll = () => {
      const container = galleryRef.current;
      if (!container) return;

      if (scrollDirection === 'vertical') {
        const currentScrollY = container.scrollTop;
        if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
          setHeaderVisible(false); // Scrolling down
        } else {
          setHeaderVisible(true); // Scrolling up
        }
        lastScrollY.current = currentScrollY;
      } else { // horizontal carousel does not scroll the galleryRef
          const carouselContainer = container.querySelector('[data-embla-container]');
          if (!carouselContainer) return;
          const currentScrollX = carouselContainer.getBoundingClientRect().x;
          if (currentScrollX < lastScrollX.current) {
              setHeaderVisible(false); // Scrolling right
          } else {
              setHeaderVisible(true); // Scrolling left
          }
          lastScrollX.current = currentScrollX;
      }
    };

    const container = galleryRef.current;
    if (scrollDirection === 'vertical') {
        container?.addEventListener('scroll', handleScroll);
    }
    if (carouselApi && scrollDirection === 'horizontal') {
        carouselApi.on('scroll', handleScroll);
    }
    
    return () => {
        container?.removeEventListener('scroll', handleScroll);
        carouselApi?.off('scroll', handleScroll);
    }
  }, [scrollDirection, carouselApi, isClient]);


  const handleSetScrollDirection = (dir: ScrollDirection) => {
    setScrollDirection(dir);
  }

  // Callback ref to populate refs map
  const setItemRef = useCallback((id: string, node: HTMLElement | null) => {
    if (node) {
      itemRefs.current.set(id, node);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  if (!isClient) {
    return <Loading />;
  }

  return (
    <main className="bg-background text-primary h-screen w-screen overflow-hidden flex flex-col">
      <header 
        className={cn(
            "absolute top-0 left-0 w-full p-4 z-50 transition-all duration-300",
            headerVisible ? "translate-y-0 bg-background/80" : "-translate-y-full"
        )}
      >
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary tracking-widest">ALLPI</h1>
          <ScrollToggle
            scrollDirection={scrollDirection}
            setScrollDirection={handleSetScrollDirection}
          />
        </div>
      </header>

      {scrollDirection === "vertical" ? (
        <div
          ref={galleryRef}
          className="flex-1 w-full h-full pt-20 scroll-smooth flex flex-col items-center gap-16 overflow-y-auto px-4"
        >
          {items.map((item, index) => {
            if (item.type === "folder") {
              return (
                <div key={item.id} className="w-full max-w-5xl flex-shrink-0">
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
                  className="w-full max-w-5xl h-auto aspect-[4/3] flex-shrink-0 transition-all duration-300"
                >
                  <ImageCard image={item} className="w-full h-full" priority={index < 3} fit="contain"/>
                </div>
              );
            }
            return null;
          })}
          <div className="h-16 w-full flex-shrink-0" />
        </div>
      ) : (
        <div ref={galleryRef} className="flex-1 w-full h-full pt-20 flex items-center justify-center">
            <Carousel setApi={setCarouselApi} className="w-full h-full max-w-6xl">
                <CarouselContent className="h-full" data-embla-container>
                {items.map((item, index) => (
                    <CarouselItem key={item.id} className="h-full w-full relative p-2">
                       {item.type === 'image' ? (
                          <ImageCard image={item} className="w-full h-full" priority={index < 3} fit="contain" />
                       ) : (
                          <FolderLane folder={item} setRef={setItemRef} scrollDirection="horizontal" />
                       )}
                    </CarouselItem>
                ))}
                </CarouselContent>
            </Carousel>
        </div>
      )}
    </main>
  );
}
