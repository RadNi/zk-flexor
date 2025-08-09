export type SigningMessage = {
  message: string
  balance_target: string
  version_hash: string
  flexor_name?: `${string}.hl`
  flexor_address?: `0x${string}`,
  custom_message?: string
} 

export type VerificationResult = { 
    status: 'verified' | 'rejected' | 'warning'; 
    statusMessage: string
}

export type Claim = {
    publicInputs: `0x${string}`, 
    full_message: string, 
    flexor_hl: string, 
    flexor_address: `0x${string}`, 
    chainId: bigint, 
    blockNumber: bigint
}

export type SubmitionInputs = {
  proof: Uint8Array<ArrayBufferLike>,
  publicInputs: Uint8Array<ArrayBufferLike>
  chainId: number,
  blockNumber: bigint,
  flexor_address?: `0x${string}`,
  flexor_hl?: `${string}.hl`,
  full_message: string,
  tip: bigint
  custom_message?: string
}

export type ProofRequest = {
  address?: `0x${string}`,
  name?: `${string}.hl`,
  message?: string,
  balance: number
}