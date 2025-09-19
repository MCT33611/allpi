"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ImageFile } from "@/lib/gallery";
import { useState } from "react";
import { Skeleton } from "./ui/skeleton";

type ImageCardProps = {
  image: Omit<ImageFile, "type">;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
};

export default function ImageCard({
  image,
  className,
  priority = false,
  fit = "cover",
}: ImageCardProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden rounded-lg border-2 border-accent/20 hover:border-accent transition-all duration-300 shadow-lg group",
        className
      )}
    >
      {isLoading && <Skeleton className="absolute inset-0 w-full h-full rounded-lg" />}
      <Image
        src={image.url}
        alt={image.name}
        fill
        sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 33vw"
        className={cn(
          "transition-opacity duration-300 ease-in-out",
          fit === "cover" && "object-cover group-hover:scale-105",
          fit === "contain" && "object-contain",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        priority={priority}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
