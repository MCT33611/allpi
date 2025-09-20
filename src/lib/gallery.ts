'use server';
import {z} from 'zod';

const REPO_OWNER = 'MCT33611';
const REPO_NAME = 'allpi';
const REPO_BRANCH = 'main';

// ---------- Types ----------
const GithubTreeFileSchema = z.object({
  path: z.string(),
  type: z.enum(['blob', 'tree', 'commit']),
  sha: z.string(),
});

const GithubTreeSchema = z.object({
  tree: z.array(GithubTreeFileSchema),
});

export type ImageFile = {
  id: string;
  type: 'image';
  name: string;
  path: string;
  url: string;
};

export type Folder = {
  id: string;
  type: 'folder';
  name: string;
  path: string;
  images: Omit<ImageFile, 'type'>[];
};

export type GalleryItem = ImageFile | Folder;

type GetGalleryItemsOptions = 
  | { type: 'all' }
  | { type: 'images' }
  | { type: 'folders' }
  | { type: 'folder'; path: string };


// ---------- Helpers ----------
async function getRepoTree(): Promise<z.infer<typeof GithubTreeFileSchema>[]> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${REPO_BRANCH}?recursive=1`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      console.error(
        `Failed to fetch GitHub repo tree. Status: ${response.status}`
      );
      return [];
    }
    const data = await response.json();
    const parsedData = GithubTreeSchema.safeParse(data);
    if (!parsedData.success) {
      console.error('Failed to parse GitHub repo tree:', parsedData.error);
      return [];
    }
    return parsedData.data.tree;
  } catch (error) {
    console.error('Error fetching repo tree:', error);
    return [];
  }
}

function isImageFile(fileName: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
}

function getBaseImageUrl(path: string) {
  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${path}`;
}

async function processRepoTree(): Promise<{ rootImages: ImageFile[], folders: Folder[] }> {
    const repoTree = await getRepoTree();
    
    const imageFiles = repoTree.filter(
      file =>
        file.type === 'blob' &&
        file.path.startsWith('pics/') &&
        isImageFile(file.path)
    );

    const folderData: {[key: string]: Omit<Folder, 'images'> & {images: ImageFile[]}} = {};
    const rootImages: ImageFile[] = [];

    for (const file of imageFiles) {
      const pathParts = file.path.split('/');
      if (pathParts.length < 2 || !pathParts[1]) continue;

      const fileName = pathParts[pathParts.length - 1];
      const isRootImage = pathParts.length === 2;

      const image: ImageFile = {
        id: file.sha,
        type: 'image',
        name: fileName,
        path: file.path,
        url: getBaseImageUrl(file.path),
      };

      if (isRootImage) {
        rootImages.push(image);
      } else {
        const folderName = pathParts[1];
        const folderPath = `pics/${folderName}`;
        if (!folderData[folderPath]) {
          folderData[folderPath] = {
            id: `${REPO_NAME}-folder-${folderName}`,
            type: 'folder',
            name: folderName,
            path: folderPath,
            images: [],
          };
        }
        folderData[folderPath].images.push(image);
      }
    }
    
    const folders: Folder[] = Object.values(folderData).map(f => ({
      ...f,
      images: f.images.sort((a,b) => a.name.localeCompare(b.name))
    })).sort((a,b) => a.name.localeCompare(b.name));
    
    rootImages.sort((a,b) => a.name.localeCompare(b.name));

    return { rootImages, folders };
}


// ---------- Main ----------
export async function getGalleryItems(options: GetGalleryItemsOptions = { type: 'all' }): Promise<GalleryItem[] | null> {
   try {
    const { rootImages, folders } = await processRepoTree();

    switch (options.type) {
        case 'images':
            return rootImages;
        case 'folders':
            return folders;
        case 'folder':
            const foundFolder = folders.find(f => f.path === options.path);
            return foundFolder ? foundFolder.images : [];
        case 'all':
        default:
            const allItems: GalleryItem[] = [...rootImages, ...folders];
            allItems.sort((a, b) => {
              if (a.type === b.type) {
                return a.name.localeCompare(b.name);
              }
              return a.type === 'image' ? -1 : 1;
            });
            return allItems;
    }
  } catch (error) {
    console.error('Error in getGalleryItems:', error);
    return null;
  }
}
