'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('../components/map'), { ssr: false });

export default function HeatmapPage() {
  return (
    <div className="flex flex-1 flex-col">
      <MapView />
    </div>
  );
}
