import { BuilderWorkspace } from "@/components/BuilderWorkspace";

type Props = { params: Promise<{ id: string }> };

export default async function BuilderProjectPage({ params }: Props) {
  const { id } = await params;
  return <BuilderWorkspace projectId={id} />;
}
