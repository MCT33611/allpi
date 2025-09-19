
'use server';
import {z} from 'zod';
import {
  determineGalleryLayout,
  type DetermineGalleryLayoutInput,
} from '@/ai/flows/determine-gallery-layout';

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
  layout: 'horizontal' | 'vertical';
};

export type GalleryItem =
  | (ImageFile & {layout: 'vertical' | 'horizontal'})
  | Folder;

// ---------- Helpers ----------
async function getRepoTree(): Promise<z.infer<typeof GithubTreeFileSchema>[]> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${REPO_BRANCH}?recursive=1`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      next: {revalidate: 3600}, // Cache for 1 hour
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

// ---------- Main ----------
export async function getGalleryItems(): Promise<GalleryItem[] | null> {
  const repoTree = await getRepoTree();
  if (repoTree.length === 0) {
    return [];
  }

  const imageFiles = repoTree.filter(
    file =>
      file.type === 'blob' &&
      file.path.startsWith('pics/') &&
      isImageFile(file.path)
  );

  const folders: {[key: string]: Omit<Folder, 'layout' | 'images'> & {images: ImageFile[]}} = {};
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
      const folderPath = pathParts.slice(1, -1).join('/');
      if (!folders[folderPath]) {
        folders[folderPath] = {
          id: `${REPO_NAME}-folder-${folderPath}`,
          type: 'folder',
          name: folderPath.split('/').pop()!,
          path: `pics/${folderPath}`,
          images: [],
        };
      }
      folders[folderPath].images.push(image);
    }
  }

  const folderItems = Object.values(folders);
  const allItems: (ImageFile | Omit<Folder, 'layout'>)[] = [
    ...rootImages,
    ...folderItems,
  ];

  if (allItems.length === 0) {
    return [];
  }

  try {
    const layoutInput: DetermineGalleryLayoutInput = {
      items: allItems.map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        path: item.path,
      })),
    };
    
    const { itemsWithLayout: layoutResult } = await determineGalleryLayout(layoutInput);

    const layoutMap = new Map(layoutResult.map(item => [item.id, item.layout]));

    const galleryItems: GalleryItem[] = allItems.map(item => {
      const layout = layoutMap.get(item.id) || (item.type === 'folder' ? 'horizontal' : 'vertical');
      if (item.type === 'folder') {
        return {
          ...item,
          layout: layout,
          images: item.images.sort((a,b) => a.name.localeCompare(b.name))
        } as Folder
      }
      return { ...item, layout } as ImageFile & { layout: 'horizontal' | 'vertical' };
    });
    
    galleryItems.sort((a, b) => a.path.localeCompare(b.path));

    return galleryItems;
  } catch (error) {
    console.error('Error in getGalleryItems:', error);
    return null;
  }
}
