import { buildWalkIndex } from "../lib/indexer/index";

export async function GET() {
  const index = await buildWalkIndex();
  const curated = index.filter((w) => w.curated);
  return new Response(JSON.stringify(curated, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
