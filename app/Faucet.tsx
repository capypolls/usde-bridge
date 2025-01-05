"use client";

import { useState, useEffect } from "react";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { opBNBTestnet } from "viem/chains";
import { readContract } from "@wagmi/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { config } from "@/lib/providers/wagmi/config";

const FAUCET_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const USDE_ADDRESS = "0x9E1eF5A92C9Bf97460Cd00C0105979153EA45b27";
const USDE_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const Faucet = () => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [faucetBalance, setFaucetBalance] = useState<bigint>(BigInt(0));

  const checkFaucetBalance = async () => {
    try {
      const account = privateKeyToAccount(FAUCET_PRIVATE_KEY);
      const balance = await readContract(config, {
        address: USDE_ADDRESS,
        abi: USDE_ABI,
        functionName: "balanceOf",
        args: [account.address],
        chainId: opBNBTestnet.id,
      });
      setFaucetBalance(balance);
    } catch (err) {
      console.error("Failed to check faucet balance:", err);
    }
  };

  useEffect(() => {
    if (config) checkFaucetBalance();
  }, []);

  const addTokenToWallet = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: USDE_ADDRESS,
            symbol: "USDe",
            decimals: 18,
            image:
              "https://assets.coingecko.com/coins/images/33613/standard/usde.png?1733810059",
          },
        },
      });
    } catch (err) {
      console.error("Failed to add token to wallet:", err);
    }
  };

  const handleFaucetRequest = async () => {
    setIsLoading(true);
    setError("");
    setTxHash("");

    try {
      if (faucetBalance < parseEther("5")) {
        throw new Error("Faucet is empty. Please try again later.");
      }

      const account = privateKeyToAccount(FAUCET_PRIVATE_KEY);
      const client = createWalletClient({
        account,
        chain: opBNBTestnet,
        transport: http(),
      });

      const hash = await client.writeContract({
        address: USDE_ADDRESS,
        abi: USDE_ABI,
        functionName: "transfer",
        args: [recipientAddress as `0x${string}`, parseEther("5")],
      });

      setTxHash(hash);
      setRecipientAddress("");
      await checkFaucetBalance();
      await addTokenToWallet();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send tokens. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[400px] border-zinc-200 bg-white">
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold text-center">
          USDe Faucet (OpBNB Testnet)
        </h2>
        <p className="text-sm text-zinc-500 text-center">
          Receive 5 USDe tokens for testing
        </p>
        <p className="text-xs text-zinc-400 text-center mt-1">
          Faucet Balance: {Math.floor(Number(faucetBalance) / 1e18)} USDe
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm mb-2 text-zinc-500">
            Recipient Address
          </label>
          <Input
            type="text"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="bg-white border-zinc-200"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        {txHash && (
          <div className="text-sm text-center">
            <a
              href={`https://testnet.opbnbscan.com/tx/${txHash}`}
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
          onClick={handleFaucetRequest}
          disabled={
            isLoading || !recipientAddress || faucetBalance < parseEther("5")
          }
        >
          {isLoading
            ? "Sending..."
            : faucetBalance < parseEther("5")
            ? "Faucet Empty"
            : "Request Tokens"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Faucet;
