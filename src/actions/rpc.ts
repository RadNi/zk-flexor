'use server';

import { createPublicClient, http } from 'viem';
import { keccak256 } from 'viem/utils';

export async function getStateRootByRPC(rpc: string, blockNumber: bigint) {
//   const chain = getChainById(chainId);
//   if (!chain) throw new Error(`Unsupported chainId ${chainId}`);
//   console.log(chain)
  // Create a public client for this chain
  const client = createPublicClient({
    // chain,
    transport: http(rpc, { timeout: 60_000 }),
  });
console.log(client)
  // Fetch proof for the zero address
  const result = await client.getProof({
    address: '0x0000000000000000000000000000000000000000',
    storageKeys: [],
    blockNumber,
  });

  if (!result.accountProof || result.accountProof.length === 0) {
    throw new Error('No account proof returned from RPC');
  }

  // Return the keccak256 of the first proof element
  return keccak256(result.accountProof[0]!);
}
