
"use server";
import { determineImageLayout } from "@/ai/flows/determine-image-layout";
import { z } from "zod";

const REPO_OWNER = "studio-prototyping";
const REPO_NAME = "allpi-gallery";
const REPO_PATH = ""; // empty string for root

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
  url:string;
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

async function getRepoContents(path: string = ""): Promise<GithubContent[]> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!response.ok) {
      console.error(`Failed to fetch GitHub repo contents for path: ${path}. Status: ${response.status}`);
      return [];
    }
    const data = await response.json();
    const parsedData = z.array(GithubContentSchema).safeParse(data);
    if (!parsedData.success) {
      console.error("Failed to parse GitHub repo contents:", parsedData.error);
      return [];
    }
    return parsedData.data;
  } catch (error) {
    console.error(`Error fetching repo contents for path ${path}:`, error);
    return [];
  }
}

function isImageFile(fileName: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const items: GalleryItem[] = [];
  const repoContents = await getRepoContents(REPO_PATH);

  for (const content of repoContents) {
    if (content.type === "file" && content.download_url && isImageFile(content.name)) {
      items.push({
        id: content.sha,
        type: "image",
        name: content.name,
        path: content.path,
        url: content.download_url,
        layout: "vertical",
      });
    } else if (content.type === "dir") {
      const folderContents = await getRepoContents(content.path);
      const images: Omit<ImageFile, "type">[] = [];
      for (const file of folderContents) {
        if (file.type === "file" && file.download_url && isImageFile(file.name)) {
          images.push({
            id: file.sha,
            name: file.name,
            path: file.path,
            url: file.download_url,
          });
        }
      }

      if (images.length > 0) {
        items.push({
          id: content.sha,
          type: "folder",
          name: content.name,
          path: content.path,
          images: images,
          layout: "horizontal",
        });
      }
    }
  }

  return items;
}

    