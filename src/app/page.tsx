import ImageGallery from '@/components/image-gallery';
import { getGalleryItems } from '@/lib/gallery';
import { Suspense } from 'react';
import Loading from './loading';

export const revalidate = 0;

// This is the "Pics" page
export default async function Home() {
  const rootImages = await getGalleryItems({ type: 'images' });

  return (
    <Suspense fallback={<Loading />}>
      <ImageGallery items={rootImages} />
    </Suspense>
  );
}
