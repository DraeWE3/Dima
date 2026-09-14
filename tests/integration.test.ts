import { test, expect } from 'vitest';
import { DimaEngine } from '../src/main/engine/DimaEngine';

test('DIMA Engine Integration Flow', async () => {
  const engine = new DimaEngine();
  
  // Start a mission in the current mocked workspace
  const res = await engine.startMission('./', 'Build a simple test button');
  
  expect(res.missionId).toBeDefined();
  expect(res.criteria).toBeInstanceOf(Array);
  expect(res.criteria.length).toBeGreaterThan(0);
});
