import { Options } from "@layerzerolabs/lz-v2-utilities";
import { readContract, simulateContract, writeContract } from "@wagmi/core";
import { useCallback } from "react";
import { Address } from "viem";

// Import contract ABIs
import { config } from "@/lib/providers/wagmi/config";
import bnbSusde from "@/lib/types/contracts/bnb-susde";
import bnbUsde from "@/lib/types/contracts/bnb-usde";
import oftAdapter from "@/lib/types/contracts/oft-adapter";

// Contract addresses as hex strings
export const SUSDE_ADAPTER_ADDRESS =
  "0x661a059C390e9f4f8Ae581d09eF0Cea6ECc124A4";
export const USDE_ADAPTER_ADDRESS =
  "0x7dA8F2F7EF7760E086c2b862cdDeBEFa8d969aa2";
export const SUSDE_ADDRESS = bnbSusde.address;
export const USDE_ADDRESS = bnbUsde.address;

// Contract ABIs
export const SUSDE_ABI = bnbSusde.abi;
export const USDE_ABI = bnbUsde.abi;

type FunctionParams = {
  approve: {
    token: Address;
    spender: Address;
    amount: bigint;
  };
  send: {
    dstEid: number;
    to: `0x${string}`; // Will only accept 32-byte hex strings
    amount: bigint;
    minAmount: bigint;
    refundAddress: Address;
  };
};

const useWeb3Bridge = () => {
  const quoteSend = useCallback(
    async (params: FunctionParams["send"], adapterAddress: Address) => {
      const options = Options.newOptions()
        .addExecutorLzReceiveOption(65000, 0)
        .toBytes();

      const sendParam = {
        dstEid: params.dstEid,
        to: params.to,
        amountLD: params.amount,
        minAmountLD: params.minAmount,
        extraOptions: `0x${Buffer.from(options).toString(
          "hex"
        )}` as `0x${string}`,
        composeMsg: "0x" as `0x${string}`,
        oftCmd: "0x" as `0x${string}`,
      };

      const result = await readContract(config, {
        address: adapterAddress,
        abi: oftAdapter.abi,
        functionName: "quoteSend",
        args: [sendParam, false],
      });

      return result;
    },
    []
  );

  const approve = useCallback(async (params: FunctionParams["approve"]) => {
    console.log("Token address:", params.token); // Add this line to debug
    const { request } = await simulateContract(config, {
      abi: USDE_ABI,
      address: params.token,
      functionName: "approve",
      args: [params.spender, params.amount],
    });
    return writeContract(config, request);
  }, []);

  const send = useCallback(
    async (params: FunctionParams["send"], nativeFee: bigint) => {
      const options = Options.newOptions()
        .addExecutorLzReceiveOption(65000, 0)
        .toBytes();

      const sendParam = {
        dstEid: params.dstEid,
        to: params.to,
        amountLD: params.amount,
        minAmountLD: params.minAmount,
        extraOptions: `0x${Buffer.from(options).toString(
          "hex"
        )}` as `0x${string}`,
        composeMsg: "0x" as `0x${string}`,
        oftCmd: "0x" as `0x${string}`,
      };

      const { request } = await simulateContract(config, {
        address: USDE_ADAPTER_ADDRESS,
        abi: oftAdapter.abi,
        functionName: "send",
        args: [
          sendParam,
          { nativeFee, lzTokenFee: BigInt(0) },
          params.refundAddress,
        ],
        value: nativeFee,
      });
      return writeContract(config, request);
    },
    []
  );

  return {
    approve,
    send,
    quoteSend,
  };
};

export default useWeb3Bridge;
