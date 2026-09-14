import { MasterEcosystemVerifier } from './MasterEcosystemVerifier';

async function main() {
  console.log('Starting Master Ecosystem Verifier (5-Hour Loop)...');
  const verifier = new MasterEcosystemVerifier('http://localhost:3000');
  try {
    // Run for 5 hours (5)
    await verifier.runChaosLoop(5);
  } catch (err) {
    console.error("CRASH:", err);
  }
}

main();
