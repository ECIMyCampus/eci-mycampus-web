import { EventDetail } from '../../../components/events/EventDetail';

export const metadata = { title: 'Actividad | ECI-MyCampus' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventDetail id={id} />;
}
