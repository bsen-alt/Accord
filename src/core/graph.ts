// src/core/graph.ts
import { Policy, PolicyGraph, GraphNode, GraphEdge } from './types';

export function buildPolicyGraph(policies: Policy[]): PolicyGraph {
  const nodes: Map<string, GraphNode> = new Map();
  const edges: GraphEdge[] = [];

  // Helper to get or create node
  const getOrCreateNode = (id: string, type: GraphNode['type'], label: string) => {
    if (!nodes.has(id)) {
      nodes.set(id, { id, type, label });
    }
    return id;
  };

  policies.forEach(policy => {
    // 1. Create Policy Node
    const policyId = getOrCreateNode(`policy:${policy.id}`, 'policy', `Policy: ${policy.id}`);

    // 2. Extract Subject Nodes (Roles/Identities)
    if (policy.subject.attributes?.role) {
      const roleId = getOrCreateNode(`role:${policy.subject.attributes.role}`, 'role', policy.subject.attributes.role);
      edges.push({ source: roleId, target: policyId, label: 'applies', type: 'applies_to' });
    }
    if (policy.subject.id) {
      const userId = getOrCreateNode(`user:${policy.subject.id}`, 'identity', policy.subject.id);
      edges.push({ source: userId, target: policyId, label: 'defined_for', type: 'applies_to' });
    }

    // 3. Extract Resource Nodes
    if (policy.resource.type) {
      const resId = getOrCreateNode(`resource:${policy.resource.type}`, 'resource', policy.resource.type);
      edges.push({ source: policyId, target: resId, label: policy.effect, type: policy.effect });
    }
  });

  return {
    nodes: Array.from(nodes.values()),
    edges
  };
}