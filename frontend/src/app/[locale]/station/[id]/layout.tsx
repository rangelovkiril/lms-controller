import { notFound }        from "next/navigation";
import { getStation }      from "@/lib/data/stations";
import { StationProvider } from "@/lib/stationContext";

interface Props {
  children: React.ReactNode;
  params:   Promise<{ id: string }>;
}

export default async function StationLayout({ children, params }: Props) {
  const { id }  = await params;
  const station = getStation(id);
  if (!station) notFound();

  return (
    <StationProvider station={station}>
      {children}
    </StationProvider>
  );
}
