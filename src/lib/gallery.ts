"use server";
import { determineImageLayout } from "@/ai/flows/determine-image-layout";
import { z } from "zod";
import { PlaceHolderImages } from "./placeholder-images";

// Types for GitHub API response
const GithubFileSchema = z.object({
  type: z.literal("file"),
  name: z.string(),
  path: z.string(),
  sha: z.string(),
  download_url: z.string().url().nullable(),
});

const GithubDirSchema = z.object({
  type: z.literal("dir"),
  name: z.string(),
  path: z.string(),
  sha: z.string(),
});

const GithubContentSchema = z.union([GithubFileSchema, GithubDirSchema]);
type GithubContent = z.infer<typeof GithubContentSchema>;

export type ImageFile = {
  id: string;
  type: "image";
  name: string;
  path: string;
  url: string;
};

export type Folder = {
  id: string;
  type: "folder";
  name: string;
  path: string;
  images: Omit<ImageFile, "type">[];
};

export type GalleryItem =
  | (ImageFile & { layout: "vertical" | "horizontal" })
  | (Folder & { layout: "vertical" | "horizontal" });

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const items: GalleryItem[] = PlaceHolderImages.map((img) => ({
    id: img.id,
    type: "image" as const,
    name: img.description,
    path: img.imageUrl,
    url: img.imageUrl,
    layout: "vertical" as const,
  }));
  return items;
}
