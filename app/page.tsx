import { MapBuilderPage } from "@/components/map-builder/map-builder-page";
import { getAppSession } from "@/lib/auth-session";
import { resolveInitialMapState } from "@/lib/place-hydration";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const session = await getAppSession();
  const initialMap = await resolveInitialMapState((await searchParams) ?? {});

  return (
    <MapBuilderPage
      initialMap={initialMap}
      isAuthenticated={Boolean(session)}
    />
  );
}
