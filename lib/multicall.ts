import {
  encodeFunctionData,
  decodeFunctionResult,
  type Abi,
} from 'viem'
import { rpcCall } from './alchemy'
import { MULTICALL3 } from './contracts'

// multicall3 aggregate3 ABI (minimal)
const MULTICALL3_ABI = [
  {
    name: 'aggregate3',
    type: 'function',
    stateMutability: 'view',
    inputs: [{
      name: 'calls',
      type: 'tuple[]',
      components: [
        { name: 'target', type: 'address' },
        { name: 'allowFailure', type: 'bool' },
        { name: 'callData', type: 'bytes' },
      ],
    }],
    outputs: [{
      name: 'returnData',
      type: 'tuple[]',
      components: [
        { name: 'success', type: 'bool' },
        { name: 'returnData', type: 'bytes' },
      ],
    }],
  },
] as const

export interface EncodedCall {
  target: `0x${string}`
  allowFailure: boolean
  callData: `0x${string}`
}

export function encodeCall(
  target: string,
  abi: Abi,
  functionName: string,
  args: unknown[]
): EncodedCall {
  return {
    target: target as `0x${string}`,
    allowFailure: true,
    callData: encodeFunctionData({ abi, functionName, args } as any),
  }
}

export function decodeResult<T>(
  abi: Abi,
  functionName: string,
  data: `0x${string}`
): T {
  return decodeFunctionResult({ abi, functionName, data } as any) as T
}

export async function multicall(calls: EncodedCall[]): Promise<(string | null)[]> {
  const calldata = encodeFunctionData({
    abi: MULTICALL3_ABI,
    functionName: 'aggregate3',
    args: [calls],
  })

  const result = await rpcCall<string>('eth_call', [
    { to: MULTICALL3, data: calldata },
    'latest',
  ])

  const decoded = decodeFunctionResult({
    abi: MULTICALL3_ABI,
    functionName: 'aggregate3',
    data: result as `0x${string}`,
  }) as { success: boolean; returnData: `0x${string}` }[]

  return decoded.map(r => (r.success ? r.returnData : null))
}
