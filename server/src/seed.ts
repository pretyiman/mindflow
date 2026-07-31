import 'dotenv/config';
import { env } from './env.js';

/**
 * Recreates the family+teacher+tech example entirely through the public REST API
 * (not direct Prisma writes) to prove the app is domain-agnostic in practice: one
 * running instance, zero hardcoded categories/relation types, multiple unrelated
 * domains (family hierarchy, education, software deps) coexisting in one map.
 *
 * Requires the server to already be running (`npm run dev -w server`).
 */

const BASE_URL = `http://localhost:${env.PORT}/api`;

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(errBody)}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function main() {
  console.log('Creating demo map...');
  const map = await call<{ id: string }>('POST', '/maps', {
    name: 'Family + Teachers + Tech Demo',
    description: 'Proves multi-relational, domain-agnostic modeling in one map'
  });

  console.log('Creating categories (zero pre-existing, created from scratch)...');
  const categories = {
    person: await call<{ id: string }>('POST', `/maps/${map.id}/categories`, {
      name: 'Person',
      icon: '🧑',
      color: '#5577aa'
    }),
    educator: await call<{ id: string }>('POST', `/maps/${map.id}/categories`, {
      name: 'Educator',
      icon: '👨‍🏫',
      color: '#55aa77'
    }),
    component: await call<{ id: string }>('POST', `/maps/${map.id}/categories`, {
      name: 'Software Component',
      icon: '⚛️',
      color: '#aa77dd'
    })
  };

  console.log('Creating relation types (zero pre-existing, created from scratch)...');
  const relationTypes = {
    parentOf: await call<{ id: string }>('POST', `/maps/${map.id}/relation-types`, {
      name: 'parent-of',
      isDirectional: true,
      isHierarchy: true,
      color: '#999999',
      lineStyle: 'solid'
    }),
    teaches: await call<{ id: string }>('POST', `/maps/${map.id}/relation-types`, {
      name: 'teaches',
      isDirectional: true,
      isHierarchy: false,
      color: '#55aa77',
      lineStyle: 'solid'
    }),
    friendOf: await call<{ id: string }>('POST', `/maps/${map.id}/relation-types`, {
      name: 'friend-of',
      isDirectional: false,
      isHierarchy: false,
      color: '#ddaa55',
      lineStyle: 'dashed'
    }),
    dependsOn: await call<{ id: string }>('POST', `/maps/${map.id}/relation-types`, {
      name: 'depends-on',
      isDirectional: true,
      isHierarchy: false,
      color: '#aa77dd',
      lineStyle: 'dotted'
    })
  };

  console.log('Creating family hierarchy nodes (independent, wired together with edges)...');
  const grandpa = await call<{ id: string }>('POST', `/maps/${map.id}/nodes`, {
    categoryId: categories.person.id,
    name: 'Grandpa',
    iconOverride: '👴',
    posX: 0,
    posY: 0
  });
  const dad = await call<{ id: string }>('POST', `/maps/${map.id}/nodes`, {
    categoryId: categories.person.id,
    name: 'Dad',
    iconOverride: '👨',
    posX: -150,
    posY: 150
  });
  const uncle = await call<{ id: string }>('POST', `/maps/${map.id}/nodes`, {
    categoryId: categories.person.id,
    name: 'Uncle',
    iconOverride: '👨',
    posX: 150,
    posY: 150
  });
  const me = await call<{ id: string }>('POST', `/maps/${map.id}/nodes`, {
    categoryId: categories.person.id,
    name: 'Me',
    iconOverride: '🧑',
    posX: -250,
    posY: 300
  });
  const sister = await call<{ id: string }>('POST', `/maps/${map.id}/nodes`, {
    categoryId: categories.person.id,
    name: 'Sister',
    iconOverride: '👧',
    posX: -50,
    posY: 300
  });

  console.log('Wiring hierarchy edges (parent-of is just an ordinary relation type now)...');
  await call('POST', `/maps/${map.id}/edges`, {
    sourceNodeId: grandpa.id,
    targetNodeId: dad.id,
    relationTypeId: relationTypes.parentOf.id
  });
  await call('POST', `/maps/${map.id}/edges`, {
    sourceNodeId: grandpa.id,
    targetNodeId: uncle.id,
    relationTypeId: relationTypes.parentOf.id
  });
  await call('POST', `/maps/${map.id}/edges`, {
    sourceNodeId: dad.id,
    targetNodeId: me.id,
    relationTypeId: relationTypes.parentOf.id
  });
  await call('POST', `/maps/${map.id}/edges`, {
    sourceNodeId: dad.id,
    targetNodeId: sister.id,
    relationTypeId: relationTypes.parentOf.id
  });

  console.log('Creating teacher (multi-relational: friend of Dad, teaches Me + Sister)...');
  const teacher = await call<{ id: string }>('POST', `/maps/${map.id}/nodes`, {
    categoryId: categories.educator.id,
    name: 'Mr. Smith',
    properties: { qualification: 'PhD Math', experience: '15 years' },
    notes: 'Teaches algebra and geometry. Also a family friend.',
    posX: 250,
    posY: 300
  });
  const friend = await call<{ id: string }>('POST', `/maps/${map.id}/nodes`, {
    categoryId: categories.person.id,
    name: 'Jake',
    iconOverride: '👦',
    posX: 450,
    posY: 300
  });

  await call('POST', `/maps/${map.id}/edges`, {
    sourceNodeId: teacher.id,
    targetNodeId: me.id,
    relationTypeId: relationTypes.teaches.id
  });
  await call('POST', `/maps/${map.id}/edges`, {
    sourceNodeId: teacher.id,
    targetNodeId: sister.id,
    relationTypeId: relationTypes.teaches.id
  });
  await call('POST', `/maps/${map.id}/edges`, {
    sourceNodeId: teacher.id,
    targetNodeId: friend.id,
    relationTypeId: relationTypes.teaches.id,
    labelOverride: 'tutors'
  });
  await call('POST', `/maps/${map.id}/edges`, {
    sourceNodeId: dad.id,
    targetNodeId: teacher.id,
    relationTypeId: relationTypes.friendOf.id
  });
  await call('POST', `/maps/${map.id}/edges`, {
    sourceNodeId: me.id,
    targetNodeId: friend.id,
    relationTypeId: relationTypes.friendOf.id
  });

  console.log('Creating unrelated software-mapping domain in the same map...');
  const react = await call<{ id: string }>('POST', `/maps/${map.id}/nodes`, {
    categoryId: categories.component.id,
    name: 'React',
    iconOverride: '⚛️',
    properties: { version: '18.2', type: 'library' },
    notes: 'JavaScript library for building user interfaces.',
    posX: 0,
    posY: 500
  });
  const vite = await call<{ id: string }>('POST', `/maps/${map.id}/nodes`, {
    categoryId: categories.component.id,
    name: 'Vite',
    posX: 200,
    posY: 500,
    iconOverride: '⚡'
  });
  await call('POST', `/maps/${map.id}/edges`, {
    sourceNodeId: vite.id,
    targetNodeId: react.id,
    relationTypeId: relationTypes.dependsOn.id
  });

  console.log(`\nDone. Map ID: ${map.id}`);
  console.log(`Open the app and select "Family + Teachers + Tech Demo" to view it.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
