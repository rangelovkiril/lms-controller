import { notFound }    from "next/navigation";
import { getStation }  from "@/lib/data/stations";
import StationClient   from "./StationClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StationPage({ params }: PageProps) {
  const { id }    = await params;
  const station   = getStation(id);

  if (!station) notFound();

  return <StationClient station={station} />;
}