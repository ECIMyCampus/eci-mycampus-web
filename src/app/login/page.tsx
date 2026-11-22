import { Suspense } from 'react';
import { LoginForm } from '../../components/auth/LoginForm';

export const metadata = { title: 'Acceder | ECI-MyCampus',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  // useSearchParams (el destino al que volver) exige un límite de Suspense para prerenderizar.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
