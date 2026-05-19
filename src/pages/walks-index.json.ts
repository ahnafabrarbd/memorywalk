import { buildWalkIndex } from "../lib/indexer/index";

export async function GET() {
  const index = await buildWalkIndex();
  return new Response(JSON.stringify(index, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
