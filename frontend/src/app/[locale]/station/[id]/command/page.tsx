import CommandClient from "./CommandClient";

// В App Router, параметрите се подават автоматично на page компонента
export default async function CommandPage({ params }: { params: { id: string, locale: string } }) {
  const { id } = await params; // В по-новите версии на Next.js (15+) params е Promise

  return <CommandClient />;
}