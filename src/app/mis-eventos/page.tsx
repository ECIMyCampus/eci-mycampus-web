import { AgendaView } from '../../components/agenda/AgendaView';

export const metadata = { title: 'Mi agenda | ECI-MyCampus',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AgendaView />;
}
