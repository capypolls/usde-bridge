"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useWeb3Bridge, { USDE_ABI, USDE_ADAPTER_ADDRESS, USDE_ADDRESS } from "@/lib/hooks/useWeb3Bridge";
import { config } from "@/lib/providers/wagmi/config";
import { ConnectKitButton } from "connectkit";
import { ArrowRightLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { getAddress, pad, formatEther } from "viem";
import { useAccount } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { readContract, simulateContract, writeContract, switchChain } from "@wagmi/core";
import { opBNBTestnet, sepolia } from "wagmi/chains";
type NetworkKey = "sepolia" | "bnb";
type TokenType = "USDe" | "SUSDe";
type ContractKey = "USDe" | "SUSDe" | "USDe_Adapter" | "SUSDe_Adapter";

const networks: Record<
  NetworkKey,
  {
    name: string;
    tokens: TokenType[];
    contracts: Record<ContractKey, string>;
  }
> = {
  sepolia: {
    name: "Sepolia",
    tokens: ["USDe", "SUSDe"] as TokenType[],
    contracts: {
      USDe: getAddress("0xf805ce4F96e0EdD6f0b6cd4be22B34b92373d696"),
      SUSDe: getAddress("0x1B6877c6Dac4b6De4c5817925DC40E2BfdAFc01b"),
      USDe_Adapter: getAddress("0x7dA8F2F7EF7760E086c2b862cdDeBEFa8d969aa2"),
      SUSDe_Adapter: getAddress("0x661a059C390e9f4f8Ae581d09eF0Cea6ECc124A4"),
    },
  },
  bnb: {
    name: "BNB Chain",
    tokens: ["USDe", "SUSDe"] as TokenType[],
    contracts: {
      USDe: getAddress("0x9E1eF5A92C9Bf97460Cd00C0105979153EA45b27"),
      SUSDe: getAddress("0x3a65168B746766066288B83417329a7F901b5569"),
      USDe_Adapter: "",
      SUSDe_Adapter: "",
    },
  },
} as const;

const Bridge = () => {
  const { approve, send, quoteSend } = useWeb3Bridge();
  const [sourceNetwork, setSourceNetwork] = useState<NetworkKey>("sepolia");
  const [targetNetwork, setTargetNetwork] = useState<NetworkKey>("bnb");
  const [token, setToken] = useState<TokenType>("USDe");
  const [amount, setAmount] = useState("");
  const { isConnected, address } = useAccount();
  const [sourceBalance, setSourceBalance] = useState<string>("0");
  const [targetBalance, setTargetBalance] = useState<string>("0");
  const [txLink, setTxLink] = useState<string>("");

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    }
  }, [isConnected, address, sourceNetwork, targetNetwork, token]);

  const getAvailableTargetNetworks = () => {
    return Object.keys(networks).filter(
      (network) => network !== sourceNetwork
    ) as NetworkKey[];
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

  const handleNetworkSwitch = async (chainId: number) => {
    try {
      await switchChain(config, {
        chainId,
      });
      await fetchBalances();
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  const getExplorerLink = (hash: string, network: NetworkKey) => {
    const baseUrl = network === 'sepolia' 
      ? 'https://sepolia.etherscan.io/tx/'
      : 'https://testnet.bscscan.com/tx/';
    return baseUrl + hash;
  };
  
  const fetchBalances = async () => {
    try {
      // Source chain balance
      const sourceTokenBalance = await readContract(config, {
        //address: networks[sourceNetwork].contracts[token] as `0x${string}`,
        address: "0xf805ce4F96e0EdD6f0b6cd4be22B34b92373d696" as `0x${string}`,
        abi: USDE_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        chainId: sepolia.id, // Sepolia chainId
      });
  
      // Target chain balance
      const targetTokenBalance = await readContract(config, {
        //address: networks[targetNetwork].contracts[token] as `0x${string}`,
        address: "0x9E1eF5A92C9Bf97460Cd00C0105979153EA45b27" as `0x${string}`,
        abi: USDE_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        chainId: opBNBTestnet.id, // BNB testnet chainId
      });

      setSourceBalance(formatEther(sourceTokenBalance));
      setTargetBalance(formatEther(targetTokenBalance));
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const handleBridge = async () => {
    try {
      const amountInWei = BigInt(parseFloat(amount) * 10 ** 18);

      // First approve
      const approveTx = await approve({
        token: networks[sourceNetwork].contracts[token] as `0x${string}`,
        spender: networks[sourceNetwork].contracts[
          "USDe_Adapter"
        ] as `0x${string}`,
        amount: amountInWei,
      });

      // Wait for approve transaction
      const approveReceipt = await waitForTransactionReceipt(config, {
        hash: approveTx,
        chainId: sourceNetwork === "sepolia" ? 11155111 : 5611,
      });

      console.log("Approval successful:", approveReceipt.transactionHash);

      const sendParam = {
        dstEid: targetNetwork === "bnb" ? 40202 : 40121,
        to: pad(address as `0x${string}`, { size: 32 }),
        amountLD: amountInWei,
        minAmountLD: amountInWei,
        refundAddress: address as `0x${string}`,
      };

      // Get quote for fees
      const { nativeFee } = await quoteSend(
        {
          dstEid: sendParam.dstEid,
          to: sendParam.to,
          amount: sendParam.amountLD,
          minAmount: sendParam.minAmountLD,
          refundAddress: sendParam.refundAddress,
        },
        networks[sourceNetwork].contracts["USDe_Adapter"] as `0x${string}`
      );

      console.log("Native fee:", nativeFee);

      // Then send
      const sendTx = await send(
        {
          dstEid: sendParam.dstEid,
          to: sendParam.to,
          amount: sendParam.amountLD,
          minAmount: sendParam.minAmountLD,
          refundAddress: sendParam.refundAddress,
        },
        nativeFee
      );

      const sendReceipt = await waitForTransactionReceipt(config, {
        hash: sendTx,
        chainId: sourceNetwork === "sepolia" ? 11155111 : 5611,
      });

      console.log("Bridge successful:", sendReceipt.transactionHash);
      setTxLink(getExplorerLink(sendReceipt.transactionHash, sourceNetwork));
      await fetchBalances();
    } catch (error) {
      console.error("Bridge error:", error);
    }
  };

  return (
    <Card className="w-[400px] border-zinc-200 bg-white">
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold text-center">
          Cross-Chain Token Bridge
        </h2>
        <p className="text-sm text-zinc-500 text-center">
          Transfer tokens between networks seamlessly
        </p>
        <div className="mt-4 flex justify-center">
          <ConnectKitButton />
        </div>
      </CardHeader>
      {isConnected ? (
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-2 text-zinc-500">From</label>
              <Select
                value={sourceNetwork}
                onValueChange={(value: NetworkKey) => setSourceNetwork(value)}
              >
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
              {/* <Button
                size="sm"
                variant="outline"
                onClick={() => handleNetworkSwitch(sourceNetwork === 'sepolia' ? 11155111 : 97)}
                className="mt-2"
              >
                Switch to {networks[sourceNetwork].name}
              </Button> */}
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
              <Select
                value={targetNetwork}
                onValueChange={(value: NetworkKey) => setTargetNetwork(value)}
              >
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
            <Select
              value={token}
              onValueChange={(value: TokenType) => setToken(value)}
            >
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

          <div className="flex justify-between text-sm text-zinc-500 mb-4">
            <div>
              <div>Source Balance:</div>
              <div className="font-medium text-black">{sourceBalance} {token}</div>
            </div>
            <div>
              <div>Target Balance:</div>
              <div className="font-medium text-black">{targetBalance} {token}</div>
            </div>
          </div>

          {txLink && (
            <div className="text-sm">
              <a 
                href={txLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
              >
                View Transaction
              </a>
            </div>
          )}

          <Button
            className="w-full bg-black text-white hover:bg-zinc-800"
            onClick={handleBridge}
          >
            Bridge Tokens
          </Button>
        </CardContent>
      ) : (
        <CardContent className="text-center text-zinc-500">
          Please connect your wallet to use the bridge
        </CardContent>
      )}
    </Card>
  );
};

export default Bridge;
