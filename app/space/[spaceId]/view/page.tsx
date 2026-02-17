import { Workspace } from "@/components/space/workspace";

export default function SpaceViewPage({ params }: { params: { spaceId: string } }): JSX.Element {
  return <Workspace spaceId={params.spaceId} mode="view" />;
}

