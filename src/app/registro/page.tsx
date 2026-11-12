import { Suspense } from 'react';
import { RegisterForm } from '../../components/auth/RegisterForm';

export const metadata = { title: 'Crear cuenta | ECI-MyCampus' };

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
