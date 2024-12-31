
import { useState } from 'react'
import { 
  createWalletClient, 
  custom, 
  parseUnits, 
  formatUnits,
  encodeFunctionData,
  Address 
} from 'viem'
import { sepolia, opBNBTestnet } from 'viem/chains'
import { publicClients } from '@/lib/web3'
import { Options } from '@layerzerolabs/lz-v2-utilities'
import { EndpointId } from '@layerzerolabs/lz-definitions'

const CONTRACTS = {
  sepolia: {
    USDe: {
      token: '0xf805ce4F96e0EdD6f0b6cd4be22B34b92373d696',
      adapter: '0x7dA8F2F7EF7760E086c2b862cdDeBEFa8d969aa2'
    },
    SUSDe: {
      token: '0x1B6877c6Dac4b6De4c5817925DC40E2BfdAFc01b',
      adapter: '0x661a059C390e9f4f8Ae581d09eF0Cea6ECc124A4'
    }
  },
  opBNBTestnet: {
    USDe: '0x9E1eF5A92C9Bf97460Cd00C0105979153EA45b27',
    SUSDe: '0x3a65168B746766066288B83417329a7F901b5569'
  }
} as const

// ABI snippets for the functions we need
const ERC20_ABI = [{
  name: 'balanceOf',
  type: 'function',
  inputs: [{ name: 'account', type: 'address' }],
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view'
}, {
  name: 'approve',
  type: 'function',
  inputs: [
    { name: 'spender', type: 'address' },
    { name: 'amount', type: 'uint256' }
  ],
  outputs: [{ name: '', type: 'bool' }]
}] as const

const OFT_ADAPTER_ABI = [{
  name: 'quoteSend',
  type: 'function',
  inputs: [
    {
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'dstEid', type: 'uint32' },
        { name: 'to', type: 'bytes' },
        { name: 'amountLD', type: 'uint256' },
        { name: 'minAmountLD', type: 'uint256' },
        { name: 'extraOptions', type: 'bytes' },
        { name: 'composeMsg', type: 'bytes' },
        { name: 'oftCmd', type: 'bytes' }
      ]
    },
    { name: 'payInLzToken', type: 'bool' }
  ],
  outputs: [
    {
      name: '',
      type: 'tuple',
      components: [
        { name: 'nativeFee', type: 'uint256' },
        { name: 'lzTokenFee', type: 'uint256' }
      ]
    }
  ],
  stateMutability: 'view'
}, {
  name: 'send',
  type: 'function',
  inputs: [/* ... full ABI ... */],
  outputs: [/* ... full ABI ... */]
}] as const

export function useWeb3Bridge() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask')
    }

    const walletClient = createWalletClient({
      chain: sepolia,
      transport: custom(window.ethereum)
    })

    const [address] = await walletClient.requestAddresses()
    return { walletClient, address }
  }

  const getBalance = async (
    tokenAddress: Address,
    chainId: 'sepolia' | 'opBNBTestnet',
    userAddress: Address
  ) => {
    try {
      const data = await publicClients[chainId].readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress]
      })

      return formatUnits(data, 18)
    } catch (err) {
      console.error('Error getting balance:', err)
      return '0'
    }
  }

  const bridgeTokens = async (
    amount: string,
    token: 'USDe' | 'SUSDe',
    sourceNetwork: 'sepolia' | 'opBNBTestnet',
    targetNetwork: 'sepolia' | 'opBNBTestnet'
  ) => {
    setLoading(true)
    setError(null)

    try {
      const { walletClient, address } = await connectWallet()
      const amountWei = parseUnits(amount, 18)
      
      const tokenContract = CONTRACTS[sourceNetwork][token]

      // Approve tokens
      const approveTx = await walletClient.writeContract({
        address: tokenContract.token,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [tokenContract.adapter, amountWei]
      })

      await walletClient.waitForTransactionReceipt({ hash: approveTx })

      // Prepare bridge parameters
      const options = Options.newOptions()
        .addExecutorLzReceiveOption(65000, 0)
        .toBytes()

      const sendParams = {
        dstEid: EndpointId.OPBNB_V2_TESTNET,
        to: address, // Convert to bytes32 if needed
        amountLD: amountWei,
        minAmountLD: amountWei,
        extraOptions: options,
        composeMsg: '0x',
        oftCmd: '0x'
      }

      // Get fee quote
      const feeQuote = await publicClients[sourceNetwork].readContract({
        address: tokenContract.adapter,
        abi: OFT_ADAPTER_ABI,
        functionName: 'quoteSend',
        args: [sendParams, false]
      })

      // Send bridge transaction
      const bridgeTx = await walletClient.writeContract({
        address: tokenContract.adapter,
        abi: OFT_ADAPTER_ABI,
        functionName: 'send',
        args: [sendParams, feeQuote, address],
        value: feeQuote[0]
      })

      return bridgeTx
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    bridgeTokens,
    getBalance,
    loading,
    error
  }
}