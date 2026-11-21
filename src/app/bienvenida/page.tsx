import { redirect } from 'next/navigation';

/** La bienvenida se fusionó con el inicio de sesión. */
export default function Page() {
  redirect('/login');
}
