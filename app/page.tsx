import { MapBuilderPage } from "@/components/map-builder/map-builder-page";
import { resolveInitialMapState } from "@/lib/place-hydration";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const initialMap = await resolveInitialMapState((await searchParams) ?? {});

  return <MapBuilderPage initialMap={initialMap} />;
}
