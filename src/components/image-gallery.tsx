
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { GalleryItem, ImageFile } from "@/lib/gallery";
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
import Header from "@/components/header";

type ScrollDirection = "vertical" | "horizontal";

type ImageGalleryProps = {
  items: GalleryItem[] | null;
  title?: string;
}

export default function ImageGallery({ items, title }: ImageGalleryProps) {
  const [isClient, setIsClient] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>("vertical");
  const [isLoading, setIsLoading] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const galleryRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const searchParams = useSearchParams();

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const itemRefs = useRef(new Map<string, HTMLElement>());
  const carouselItemRefs = useRef(new Map<string, number>());
  
  const imagesOnly: ImageFile[] = items?.filter(item => item.type === 'image') as ImageFile[] || [];
  
  imagesOnly?.forEach((item, index) => {
    carouselItemRefs.current.set(item.id, index);
  });
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleScroll = useCallback(() => {
    if (!galleryRef.current) return;
    const currentScrollY = galleryRef.current.scrollTop;

    if (Math.abs(currentScrollY - lastScrollY.current) < 20) return;

    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setIsHeaderVisible(false); // Scrolling down
    } else {
      setIsHeaderVisible(true); // Scrolling up
    }
    lastScrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
    const galleryElement = galleryRef.current;
    if (scrollDirection === 'vertical') {
      galleryElement?.addEventListener('scroll', handleScroll);
    } else {
      setIsHeaderVisible(true); // Always show header in horizontal mode
    }
    return () => {
      galleryElement?.removeEventListener('scroll', handleScroll);
    };
  }, [scrollDirection, handleScroll]);

  useEffect(() => {
    if (items) {
      setIsLoading(false);
    }
  }, [items]);

  useEffect(() => {
    if (!isClient || !items?.length) return;

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
  }, [searchParams, items, carouselApi, scrollDirection, isClient]);


  useEffect(() => {
    if (!carouselApi || !isClient || !imagesOnly) return;

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
  }, [carouselApi, imagesOnly, isClient]);


  useEffect(() => {
    if (scrollDirection !== 'vertical' || !isClient || !items) return;

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
       <Header isVisible={isHeaderVisible} />
       <div className={cn("absolute top-20 left-0 w-full z-40 flex justify-center items-center p-4 transition-transform duration-300", isHeaderVisible ? 'translate-y-0' : '-translate-y-40')}>
        <div className="flex items-center gap-4">
          {title && <h1 className="text-2xl font-bold text-primary tracking-widest">{title}</h1>}
          <ScrollToggle
            scrollDirection={scrollDirection}
            setScrollDirection={handleSetScrollDirection}
            disableHorizontal={items?.some(item => item.type === 'folder')}
          />
        </div>
      </div>

      {scrollDirection === "vertical" ? (
        <div
          ref={galleryRef}
          className="flex-1 w-full h-full pt-32 pb-8 scroll-smooth flex flex-col items-center gap-16 overflow-y-auto px-4"
        >
          {items?.map((item, index) => {
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
        <div ref={galleryRef} className="w-full h-full pt-32 pb-12">
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
