
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
import Loading from "@/app/loading";

type ScrollDirection = "vertical" | "horizontal";

export default function ImageGallery({ items }: { items: GalleryItem[] | null }) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>("vertical");
  const galleryRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const lastScrollX = useRef(0);

  const itemRefs = useRef(new Map<string, HTMLElement>());
  const carouselItemRefs = useRef(new Map<string, number>());
  
  const imagesOnly = items?.flatMap(item => {
    if (item.type === "image") return [item];
    if (item.type === "folder") return item.images;
    return [];
  });
  
  imagesOnly?.forEach((item, index) => {
    carouselItemRefs.current.set(item.id, index);
  });

  items?.forEach((item, index) => {
    if(item.type === 'folder') {
      carouselItemRefs.current.set(item.id, index); // for vertical
      item.images.forEach(img => {
        carouselItemRefs.current.set(img.id, index); // for vertical
      })
    }
  });

  useEffect(() => {
    setIsClient(true);
    if (items) {
      setIsLoading(false);
    }
  }, [items]);

  useEffect(() => {
    if (!isClient || !items?.length || isLoading) return;

    const startImageId = searchParams.get("imageId") || localStorage.getItem("lastSeenImageId");

    if (startImageId) {
        if (scrollDirection === 'horizontal' && carouselApi) {
            const index = carouselItemRefs.current.get(startImageId);
            if (typeof index === 'number') {
                setTimeout(() => carouselApi.scrollTo(index, true), 100);
            }
        } else {
             let attempts = 0;
            const maxAttempts = 100;
            const tryScroll = () => {
                const element = itemRefs.current.get(startImageId);
                if (element) {
                    element.scrollIntoView({ behavior: "auto", block: "center" });
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(tryScroll, 50);
                }
            };
            setTimeout(tryScroll, 100);
        }
    }
  }, [searchParams, items, carouselApi, scrollDirection, isClient, isLoading]);


  useEffect(() => {
    if (!carouselApi || !isClient || !imagesOnly || isLoading) return;

    const onSelect = (api: CarouselApi) => {
      const slideIndex = api.selectedScrollSnap();
      const currentItem = imagesOnly[slideIndex];
      if (currentItem) {
        localStorage.setItem("lastSeenImageId", currentItem.id);
        const newUrl = `${window.location.pathname}?imageId=${currentItem.id}`;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
      }
    };

    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi, imagesOnly, isClient, isLoading]);


  useEffect(() => {
    if (scrollDirection !== 'vertical' || !isClient || !items || isLoading) return;

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
  }, [items, scrollDirection, isClient, isLoading]);


  useEffect(() => {
    if (!isClient) return;
    const handleScroll = () => {
      const container = galleryRef.current;
      if (!container) return;

      if (scrollDirection === 'vertical') {
        const currentScrollY = container.scrollTop;
        if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
          setHeaderVisible(false);
        } else {
          setHeaderVisible(true);
        }
        lastScrollY.current = currentScrollY;
      } else {
          const carouselContainer = container.querySelector('[data-embla-container]');
          if (!carouselContainer) return;
          const currentScrollX = carouselContainer.getBoundingClientRect().x;
          if (currentScrollX < lastScrollX.current) {
              setHeaderVisible(false);
          } else {
              setHeaderVisible(true);
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

  const setItemRef = useCallback((id: string, node: HTMLElement | null) => {
    if (node) {
      itemRefs.current.set(id, node);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  if (!isClient || isLoading) {
    return <Loading />;
  }

  return (
    <main className="bg-background text-primary h-screen w-screen overflow-hidden flex flex-col">
      <header 
        className={cn(
            "absolute top-0 left-0 w-full p-4 z-50 transition-all duration-300",
            headerVisible ? "translate-y-0 bg-gradient-to-b from-background/80 to-transparent" : "-translate-y-full"
        )}
      >
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary tracking-widest">ALLPI</h1>
          <ScrollToggle
            scrollDirection={scrollDirection}
            setScrollDirection={handleSetScrollDirection}
          />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 overflow-hidden">
          <div
            className={cn(
              "w-full h-full bg-accent/20",
              !isLoading && "hidden"
            )}
          >
            <div className="h-full bg-accent animate-youtube-loader"></div>
          </div>
        </div>
      </header>

      {scrollDirection === "vertical" ? (
        <div
          ref={galleryRef}
          className="flex-1 w-full h-full pt-24 pb-8 scroll-smooth flex flex-col items-center gap-16 overflow-y-auto px-4"
        >
          {items.map((item, index) => {
            if (item.type === "folder") {
              return (
                <div key={item.id} className="w-full max-w-5xl flex-shrink-0">
                  <FolderLane
                    folder={item}
                    setRef={setItemRef}
                    scrollDirection="vertical"
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
        <div ref={galleryRef} className="w-full h-full pt-24 pb-12">
          <Carousel setApi={setCarouselApi} className="w-full h-full max-w-6xl mx-auto">
            <CarouselContent className="h-full p-4">
              {imagesOnly?.map((item, index) => (
                <CarouselItem
                  key={item.id}
                  className="h-full w-full flex items-center justify-center"
                >
                  <div className="relative w-full h-[80vh]">
                    <ImageCard
                      image={item}
                      className="w-full h-full"
                      priority={index < 3}
                      fit="contain"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}
    </main>
  );
}
