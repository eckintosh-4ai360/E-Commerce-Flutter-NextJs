import type { Metadata } from 'next';
import { BuyForMeView } from '@/components/store/BuyForMeView';
export const metadata: Metadata = { title: 'Buy for me', robots: { index: false } };
export default function Page() { return <BuyForMeView />; }
