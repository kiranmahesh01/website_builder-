import { notFound } from "next/navigation";
import { SpecSiteRenderer } from "@/components/SpecSiteRenderer";
import { SHOWCASE_BY_SLUG } from "@/lib/showcase-examples";

export default async function ExamplePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const example = SHOWCASE_BY_SLUG[slug];
  if (!example) notFound();

  return <SpecSiteRenderer spec={example.spec} />;
}
