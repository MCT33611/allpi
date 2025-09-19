"use server";
import { determineImageLayout } from "@/ai/flows/determine-image-layout";
import { z } from "zod";

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

const GITHUB_API_URL = "https://api.github.com/repos/MCT33611/allpi/contents/";

async function getRepoContents(path: string): Promise<GithubContent[]> {
  try {
    const response = await fetch(`${GITHUB_API_URL}${path}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    if (!response.ok) {
      console.error(`Failed to fetch GitHub repo contents for path: ${path}. Status: ${response.status}`);
      return [];
    }
    const data = await response.json();
    return z.array(GithubContentSchema).parse(data);
  } catch (error) {
    console.error(`Error fetching or parsing repo contents for ${path}:`, error);
    return [];
  }
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const contents = await getRepoContents("pics");
  contents.sort((a, b) => a.name.localeCompare(b.name));

  const itemPromises = contents.map(
    async (content): Promise<GalleryItem | null> => {
      if (
        content.type === "file" &&
        /\.(jpe?g|png|gif|webp)$/i.test(content.name) &&
        content.download_url
      ) {
        const layoutResult = await determineImageLayout({
          location: content.path,
          extension: content.name.split(".").pop() || "",
          isFolder: false,
        });

        return {
          id: content.sha,
          type: "image",
          name: content.name,
          path: content.path,
          url: content.download_url,
          layout: layoutResult.layoutStrategy,
        };
      } else if (content.type === "dir") {
        const subContents = await getRepoContents(content.path);
        const images: Omit<ImageFile, "type">[] = subContents
          .filter(
            (item): item is z.infer<typeof GithubFileSchema> =>
              item.type === "file" &&
              /\.(jpe?g|png|gif|webp)$/i.test(item.name) &&
              !!item.download_url
          )
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((item) => ({
            id: item.sha,
            name: item.name,
            path: item.path,
            url: item.download_url!, // Already filtered for non-null
          }));

        if (images.length > 0) {
          const layoutResult = await determineImageLayout({
            location: content.path,
            extension: "",
            isFolder: true,
            imageCount: images.length,
          });

          return {
            id: content.sha,
            type: "folder",
            name: content.name,
            path: content.path,
            images,
            layout: layoutResult.layoutStrategy,
          };
        }
      }
      return null;
    }
  );

  const items = (await Promise.all(itemPromises)).filter(
    (item): item is GalleryItem => item !== null
  );

  return items;
}
