'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('../components/map'), { ssr: false });

export default function HeatmapPage() {
  return <MapView />;
}
