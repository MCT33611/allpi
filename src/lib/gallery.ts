
"use server";
import { z } from "zod";
import { determineImageLayout } from "@/ai/flows/determine-image-layout";

const REPO_OWNER = "MCT33611";
const REPO_NAME = "allpi";
const REPO_BRANCH = "main";

// ---------- Types ----------
const GithubTreeFileSchema = z.object({
  path: z.string(),
  type: z.enum(["blob", "tree", "commit"]),
  sha: z.string(),
});

const GithubTreeSchema = z.object({
  tree: z.array(GithubTreeFileSchema),
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

async function getLayoutForGalleryItem(item: Omit<GalleryItem, 'layout'>): Promise<'horizontal' | 'vertical'> {
    try {
        const input = {
            location: item.path,
            extension: item.type === 'image' ? item.name.split('.').pop() || '' : '',
            isFolder: item.type === 'folder',
            imageCount: item.type === 'folder' ? item.images.length : undefined,
            // These are omitted as we don't have image dimensions available here
            // averageImageWidth: undefined, 
            // averageImageHeight: undefined,
        }
        const result = await determineImageLayout(input);
        return result.layoutStrategy;
    } catch (error) {
        console.error("Error determining layout, defaulting to horizontal for folders and vertical for images", error);
        return item.type === 'folder' ? 'horizontal' : 'vertical';
    }
}


// ---------- Main ----------
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const repoTree = await getRepoTree();
  
  const imageFiles = repoTree.filter(
    (file) => file.type === "blob" && file.path.startsWith("pics/") && isImageFile(file.path)
  );

  const folders: { [key: string]: Omit<Folder, 'layout'> } = {};
  const rootImages: Omit<ImageFile & { type: 'image' }, 'layout'>[] = [];

  for (const file of imageFiles) {
    const pathParts = file.path.split("/"); // e.g. ['pics', 'landscapes', 'image.jpg']
    if (pathParts.length <= 1) continue; // Skip files directly in root
    
    const fileName = pathParts.pop()!; // 'image.jpg'
    const parentPath = pathParts.slice(1).join('/'); // 'landscapes' or ''

    const image: Omit<ImageFile, "type"> = {
      id: file.sha,
      name: fileName,
      path: file.path,
      url: getBaseImageUrl(file.path),
    };

    if (parentPath) { // It's in a folder
      if (!folders[parentPath]) {
        folders[parentPath] = {
          id: `${REPO_NAME}-folder-${parentPath}`,
          type: "folder",
          name: parentPath.split('/').pop()!,
          path: `pics/${parentPath}`,
          images: [],
        };
      }
      folders[parentPath].images.push(image);
    } else { // It's directly in 'pics/'
      rootImages.push({
        ...image,
        type: 'image'
      });
    }
  }

  const folderItems = Object.values(folders);
  const allItems: (Omit<GalleryItem, 'layout'>)[] = [...rootImages, ...folderItems];

  const layoutPromises = allItems.map(item => getLayoutForGalleryItem(item));
  const layouts = await Promise.all(layoutPromises);
  
  const galleryItems: GalleryItem[] = allItems.map((item, index) => ({
      ...item,
      layout: layouts[index]
  }));


  // Sort folders by path/name and images inside them by name
  galleryItems.sort((a, b) => a.path.localeCompare(b.path));
  galleryItems.forEach((item) => {
    if (item.type === 'folder') {
        item.images.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  return galleryItems;
}
