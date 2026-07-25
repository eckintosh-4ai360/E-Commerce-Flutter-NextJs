import type { Metadata } from 'next';

import { ProfileView } from '@/components/store/account/ProfileView';

export const metadata: Metadata = {
  title: 'Edit Profile',
  robots: { index: false },
};

export default function Page() {
  return <ProfileView />;
}
