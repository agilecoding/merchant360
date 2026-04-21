import { describe, it, expect } from 'vitest';

const GQL_URL = process.env.GRAPHQL_URL ?? 'http://localhost:4000/graphql';

async function gql(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

describe('GraphQL Gateway', () => {
  it('introspection responds', async () => {
    const result = await gql('{ __typename }');
    expect(result.data.__typename).toBe('Query');
  });
});
