"use server";
import { z } from "zod";

const REPO_OWNER = "MCT33611";
const REPO_NAME = "allpi";
const REPO_BRANCH = "main";

// ---------- Types ----------
const GithubTreeFileSchema = z.object({
  path: z.string(),
  type: z.enum(["blob", "tree", "commit"]),
  sha: z.string(),
  url: z.string().url(),
});

const GithubTreeSchema = z.object({
  sha: z.string(),
  url: z.string().url(),
  tree: z.array(GithubTreeFileSchema),
  truncated: z.boolean(),
});

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
  name: string; // folder name only
  path: string; // relative path
  images: Omit<ImageFile, "type">[];
  layout: "horizontal" | "vertical";
};

export type GalleryItem =
  | (ImageFile & { layout: "vertical" | "horizontal" })
  | Folder;

// ---------- Helpers ----------
async function getRepoTree(): Promise<z.infer<typeof GithubTreeFileSchema>[]> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${REPO_BRANCH}?recursive=1`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 3600 }, // Re-fetch every hour
    });
    if (!response.ok) {
      console.error(`Failed to fetch GitHub repo tree. Status: ${response.status}`);
      return [];
    }
    const data = await response.json();
    const parsedData = GithubTreeSchema.safeParse(data);
    if (!parsedData.success) {
      console.error("Failed to parse GitHub repo tree:", parsedData.error);
      return [];
    }
    return parsedData.data.tree;
  } catch (error) {
    console.error("Error fetching repo tree:", error);
    return [];
  }
}

function isImageFile(fileName: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
}

function getBaseImageUrl(path: string) {
  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${path}`;
}

// ---------- Main ----------
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const repoTree = await getRepoTree();

  // Filter only images inside "pics/"
  const imageFiles = repoTree.filter(
    (file) => file.type === "blob" && file.path.startsWith("pics/") && isImageFile(file.path)
  );

  const folders: { [key: string]: Folder } = {};
  const rootImages: GalleryItem[] = [];

  for (const file of imageFiles) {
    const pathParts = file.path.split("/"); // e.g. ['pics', 'landscapes', 'mountains', 'image.jpg']
    const fileName = pathParts.at(-1)!;
    const folderPath = pathParts.slice(1, -1).join("/"); // "landscapes/mountains"

    const image: Omit<ImageFile, "type"> = {
      id: file.sha,
      name: fileName,
      path: file.path,
      url: getBaseImageUrl(file.path),
    };

    if (folderPath) {
      if (!folders[folderPath]) {
        folders[folderPath] = {
          id: `${REPO_NAME}-folder-${folderPath}`,
          type: "folder",
          name: folderPath, // keep relative folder path as name
          path: `pics/${folderPath}`,
          images: [],
          layout: "horizontal",
        };
      }
      folders[folderPath].images.push(image);
    } else {
      // directly inside "pics/"
      rootImages.push({
        ...image,
        type: "image",
        layout: "vertical",
      });
    }
  }

  const folderItems: GalleryItem[] = Object.values(folders);

  // Sort folders by path/name and images inside them by name
  folderItems.sort((a, b) => a.name.localeCompare(b.name));
  folderItems.forEach((folder) => {
    folder.images.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Sort root images by name
  rootImages.sort((a, b) => a.name.localeCompare(b.name));

  return [...rootImages, ...folderItems];
}
