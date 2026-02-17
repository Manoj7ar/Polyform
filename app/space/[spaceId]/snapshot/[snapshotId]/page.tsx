import { Workspace } from "@/components/space/workspace";

export default function SnapshotPage({
  params,
}: {
  params: { spaceId: string; snapshotId: string };
}): JSX.Element {
  return <Workspace spaceId={params.spaceId} mode="view" snapshotId={params.snapshotId} />;
}

