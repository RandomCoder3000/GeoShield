'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the actual map component, disabling SSR
const LazyMap = dynamic(() => import('./CacheMap'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[500px] rounded-xl" />,
});

export function MapWrapper({ caches }: { caches: any[] }) {
  return <LazyMap caches={caches} />;
}
