import { Workspace } from "@/components/space/workspace";

export default function SpacePage({
  params,
  searchParams,
}: {
  params: { spaceId: string };
  searchParams: { mode?: "edit" | "view"; token?: string };
}): JSX.Element {
  const mode = searchParams.mode === "view" ? "view" : "edit";
  return <Workspace spaceId={params.spaceId} mode={mode} shareToken={searchParams.token} />;
}

