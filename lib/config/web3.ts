import { createConfig, http } from 'wagmi'
import { sepolia, opBNBTestnet } from 'wagmi/chains'
import { createPublicClient, http as publicHttp } from 'viem'

export const chains = {
  sepolia,
  opBNBTestnet
}

export const config = createConfig({
  chains: [sepolia, opBNBTestnet],
  transports: {
    [sepolia.id]: http(),
    [opBNBTestnet.id]: http()
  }
})

// Public clients for reading data without wallet connection
export const publicClients = {
  sepolia: createPublicClient({
    chain: sepolia,
    transport: publicHttp()
  }),
  opBNBTestnet: createPublicClient({
    chain: opBNBTestnet,
    transport: publicHttp()
  })
} 