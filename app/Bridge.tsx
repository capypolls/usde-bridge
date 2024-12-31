'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRightLeft } from 'lucide-react';

type NetworkKey = 'sepolia' | 'bnb';
type TokenType = 'USDE' | 'SUSDE';

const networks = {
  sepolia: {
    name: 'Sepolia',
    tokens: ['USDE', 'SUSDE'] as TokenType[],
    contracts: {
      USDE: '0x...',
      SUSDE: '0x...'
    }
  },
  bnb: {
    name: 'BNB Chain',
    tokens: ['USDE', 'SUSDE'] as TokenType[],
    contracts: {
      USDE: '0x...',
      SUSDE: '0x...'
    }
  }
} as const;

const Bridge = () => {
  const [sourceNetwork, setSourceNetwork] = useState<NetworkKey>('sepolia');
  const [targetNetwork, setTargetNetwork] = useState<NetworkKey>('bnb');
  const [token, setToken] = useState<TokenType>('USDE');
  const [amount, setAmount] = useState('');

  const getAvailableTargetNetworks = () => {
    return Object.keys(networks).filter(network => network !== sourceNetwork) as NetworkKey[];
  };

  const getAvailableTokens = () => {
    if (!sourceNetwork) return [];
    return networks[sourceNetwork].tokens;
  };

  const handleSwapNetworks = () => {
    if (sourceNetwork && targetNetwork) {
      setSourceNetwork(targetNetwork);
      setTargetNetwork(sourceNetwork);
    }
  };

  return (
    <Card className="w-[400px] border-zinc-200 bg-white">
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold text-center">Cross-Chain Token Bridge</h2>
        <p className="text-sm text-zinc-500 text-center">Transfer tokens between networks seamlessly</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-2 text-zinc-500">From</label>
            <Select value={sourceNetwork} onValueChange={(value: NetworkKey) => setSourceNetwork(value)}>
              <SelectTrigger className="bg-white border-zinc-200 focus:ring-1 focus:ring-black">
                <SelectValue>{networks[sourceNetwork].name}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border border-zinc-200 shadow-md">
                {Object.entries(networks).map(([key, network]) => (
                  <SelectItem 
                    key={key} 
                    value={key as NetworkKey}
                    className="hover:bg-zinc-100 focus:bg-zinc-100"
                  >
                    {network.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="ghost" 
            size="icon"
            className="mt-6"
            onClick={handleSwapNetworks}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <label className="block text-sm mb-2 text-zinc-500">To</label>
            <Select value={targetNetwork} onValueChange={(value: NetworkKey) => setTargetNetwork(value)}>
              <SelectTrigger className="bg-white border-zinc-200 focus:ring-1 focus:ring-black">
                <SelectValue>{networks[targetNetwork].name}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border border-zinc-200 shadow-md">
                {getAvailableTargetNetworks().map((network) => (
                  <SelectItem 
                    key={network} 
                    value={network}
                    className="hover:bg-zinc-100 focus:bg-zinc-100"
                  >
                    {networks[network].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2 text-zinc-500">Token</label>
          <Select value={token} onValueChange={(value: TokenType) => setToken(value)}>
            <SelectTrigger className="bg-white border-zinc-200 focus:ring-1 focus:ring-black">
              <SelectValue>{token}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border border-zinc-200 shadow-md">
              {getAvailableTokens().map((token) => (
                <SelectItem 
                  key={token} 
                  value={token}
                  className="hover:bg-zinc-100 focus:bg-zinc-100"
                >
                  {token}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm mb-2 text-zinc-500">Amount</label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-white border-zinc-200"
          />
        </div>

        <Button className="w-full bg-black text-white hover:bg-zinc-800">
          Bridge Tokens
        </Button>
      </CardContent>
    </Card>
  );
};

export default Bridge;