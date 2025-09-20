import ImageGallery from "@/components/image-gallery";
import { getGalleryItems } from "@/lib/gallery";
import { Suspense } from "react";
import Loading from "@/app/loading";

export const revalidate = 0;

type FolderPageProps = {
  params: {
    folderName: string;
  };
};

export default async function FolderPage({ params }: FolderPageProps) {
  const { folderName } = params;
  const folderContents = await getGalleryItems({ type: 'folder', path: `pics/${folderName}` });

  return (
    <Suspense fallback={<Loading />}>
      <ImageGallery items={folderContents} title={folderName} />
    </Suspense>
  );
}
