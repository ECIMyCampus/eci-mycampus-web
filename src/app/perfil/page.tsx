import { ProfileView } from '../../components/auth/ProfileView';

export const metadata = { title: 'Perfil | ECI-MyCampus',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileView />;
}
