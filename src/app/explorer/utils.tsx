import { wagmiConfig } from '@/config/wagmi'
import { FLEXOR_ADDRESS, verifyFinalProof } from "@/lib/utils"
import { hashPersonalMessage } from '@ethereumjs/util'
import { readContract } from '@wagmi/core'
import abi from "public/Flexor.json"
import { createPublicClient, fromHex, http, toHex } from 'viem'

type VerificationResult = { 
    status: 'verified' | 'rejected' | 'warning'; 
    statusMessage: string 
}

// Find chain config by chainId from wagmiConfig.chains
function getChainById(chainId: number) {
  return wagmiConfig.chains.find((chain) => chain.id === chainId)
}

async function getBlockByChainId(chainId: number, blockNumber: bigint ) {
  const chain = getChainById(chainId)
  if (!chain) throw new Error(`Unsupported chainId ${chainId}`)

  // Create client dynamically for this chain using its first RPC url
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]), // or chain.rpcUrls.public.http[0]
  })

  // Fetch block
  const block = await client.getBlock({ blockNumber })

  return block
}

export async function fullVerifyProof(claimId: string): Promise<VerificationResult> {
    const result = await readContract(wagmiConfig, {
        abi,
        address: FLEXOR_ADDRESS,
        functionName: 'getClaim',
        args: [claimId],
    }) as {
        proof: `0x${string}`, publicInputs: `0x${string}`, full_message: string, flexor_hl: string, flexor_address: `0x${string}`, chainId: bigint, blockNumber: bigint
    }
    const proof = fromHex(result.proof, 'bytes')
    const publicInputs = Array.from(fromHex(result.publicInputs, 'bytes'), (byte) => "0x" + byte.toString(16).padStart(2, '0')) 
    const full_message = JSON.parse(result.full_message)
    console.log('Contract result:', full_message)
    console.log(result)
    let name_check = false
    let verification_check = false
    let stateRoot_check = false
    let address_check = false
    let balance_target_check = false
    let message_hash_check = false
    
    // verify hl_name
    if ("flexor_name" in full_message)
        name_check = full_message.flexor_name.endsWith(".hl") && (result.flexor_hl === full_message.flexor_name)
    else
        name_check = result.flexor_hl === ""
    // verify address
    if ("flexor_address" in full_message)
        address_check = result.flexor_address.toLowerCase() === full_message.flexor_address.toLowerCase()
    else
        address_check = result.flexor_address === "0x0000000000000000000000000000000000000000"
    // verify stateRoot
    stateRoot_check = false

    let statusMessage = ""
    try {
        let block = await getBlockByChainId(+result.chainId.toString(), result.blockNumber)
        console.log(block.stateRoot)
        console.log(result.publicInputs.substring(0, 66))
        stateRoot_check = block.stateRoot === result.publicInputs.substring(0, 66)
    } catch (err) {
        statusMessage += (err + " - ")
    }

    // balance target
    const balance_target_length = +BigInt(publicInputs[96]!).toString()
    const balance_target = BigInt("0x" + result.publicInputs.substring(2 + 32*4, 2 + 32 * 4 + balance_target_length * 2))
    balance_target_check = Math.floor(parseFloat(full_message.balance_target) * 1e18).toString() === balance_target.toString()

    // message hash
    const msgBuf = Buffer.from(result.full_message)
    const hashed_message = hashPersonalMessage(msgBuf)
    message_hash_check = toHex(hashed_message) === "0x" + result.publicInputs.substring(2 + 32*2, 2 + 32*4)

    // verify proof
    verification_check = await verifyFinalProof(proof, publicInputs)

    console.log("name_check ", name_check)
    console.log("address_check ", address_check)
    console.log("stateRoot_check ", stateRoot_check)
    console.log("verification_check ", verification_check)
    console.log("balance_target_check", balance_target_check)
    console.log("message_hash_check", message_hash_check)

    if (!name_check)
        statusMessage += "name check faild - "
    if (!address_check)
        statusMessage += "address check faild - "
    if (!stateRoot_check)
        statusMessage += "state root check faild - "
    if (!verification_check)
        statusMessage += "proof verification faild - "
    if (!balance_target_check)
        statusMessage += "balance target check faild - "
    if (!message_hash_check)
        statusMessage += "message check faild - "

    let status: 'verified' | 'rejected' | 'warning' = 'rejected'
    if (name_check && verification_check && address_check && balance_target_check && message_hash_check) {
        if (stateRoot_check) {
            status = 'verified'
            statusMessage = 'Proof is verified'
        }
        else if (result.chainId === 999n) {
            statusMessage = 'Hyperliquid RPCs are broken to verify state root!'
            status = 'warning'
        }
    }
    return {status, statusMessage}
}