import ImageGallery from '@/components/image-gallery';
import { getGalleryItems } from '@/lib/gallery';
import { Suspense } from 'react';
import Loading from './loading';

export const revalidate = 3600; // Re-fetch data every hour

export default async function Home() {
  const galleryItems = await getGalleryItems();
  
  return (
    <Suspense fallback={<Loading />}>
      <ImageGallery items={galleryItems} />
    </Suspense>
  );
}
