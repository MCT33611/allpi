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
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
  };
  
  try {
    const response = await fetch(url, {
      headers,
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

    const folderData: {[key: string]: Omit<Folder, 'images'> & {images: Omit<ImageFile, 'type'>[]}} = {};
    const rootImages: ImageFile[] = [];

    for (const file of imageFiles) {
        const pathParts = file.path.split('/');
        // pathParts would be ['pics', 'image.jpg'] for a root image
        // or ['pics', 'folderName', 'image.jpg'] for a folder image
        if (pathParts.length < 2 || pathParts[0] !== 'pics') continue;
  
        const fileName = pathParts[pathParts.length - 1];
        
        // Check if the image is directly inside 'pics' folder
        const isRootImage = pathParts.length === 2;
  
        const image: Omit<ImageFile, 'type'> = {
          id: file.sha,
          name: fileName,
          path: file.path,
          url: getBaseImageUrl(file.path),
        };
  
        if (isRootImage) {
          rootImages.push({ ...image, type: 'image' });
        } else if (pathParts.length > 2) {
            const folderName = pathParts[1];
            if (!folderName) continue;
            
            const folderPath = `pics/${folderName}`;
            if (!folderData[folderPath]) {
              folderData[folderPath] = {
                id: `${REPO_NAME}-folder-${folderName}`, // Generate a unique ID for the folder
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
            if (foundFolder) {
                return foundFolder.images.map(img => ({ ...img, type: 'image' }));
            }
            return [];
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
