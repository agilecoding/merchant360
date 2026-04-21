const GQL_URL = process.env.GRAPHQL_INTERNAL_URL ?? 'http://localhost:4000/graphql';

interface GqlOptions {
  query: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export async function gqlFetch<T = unknown>({
  query,
  variables,
  headers = {},
}: GqlOptions): Promise<T> {
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`);
  }

  const json = await res.json() as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data as T;
}
