import { simulateContract, writeContract } from "@wagmi/core";
import { useCallback } from "react";
import { Address, parseUnits } from "viem";
import { Options, addressToBytes32 } from '@layerzerolabs/lz-v2-utilities';
import { getAddress } from 'viem' // Add this import

// Import contract ABIs
import susdeAdapter from "@/lib/types/contracts/susde-adapter";
import usdeAdapter from "@/lib/types/contracts/usde-adapter";
import susde from "@/lib/types/contracts/bnb-susde";
import usde from "@/lib/types/contracts/bnb-usde";
import { config } from "@/lib/providers/wagmi/config";

// Contract addresses as hex strings
export const SUSDE_ADAPTER_ADDRESS = susdeAdapter.address as `0x${string}`;
export const USDE_ADAPTER_ADDRESS = getAddress(usdeAdapter.address) as `0x${string}`;
export const SUSDE_ADDRESS = susde.address as `0x${string}`;
export const USDE_ADDRESS = usde.address as `0x${string}`;


// Contract ABIs
export const SUSDE_ADAPTER_ABI = susdeAdapter.abi;
export const USDE_ADAPTER_ABI = usdeAdapter.abi;
export const SUSDE_ABI = susde.abi;
export const USDE_ABI = usde.abi;

type FunctionParams = {
  approve: {
    token: Address;
    spender: Address;
    amount: bigint;
  };
  send: {
    dstEid: number;
    to: any;
    //to: `0x${string}`; // This should accept the bytes32 format
    amount: bigint;
    minAmount: bigint;
    refundAddress: Address;
  };
};

const useWeb3Bridge = () => {
  const quoteSend = useCallback(async (params: FunctionParams["send"], adapterAddress: Address, adapterAbi: any) => {
    const options = Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes();
    
    const sendParam = {
      dstEid: params.dstEid,
      //to: params.to as `0x${string}`,
      to: params.to,
      amountLD: params.amount,
      minAmountLD: params.minAmount,
      extraOptions: options,
      composeMsg: "0x",
      oftCmd: "0x"
    };

    const { result } = await simulateContract(config, {
      address: adapterAddress,
      abi: adapterAbi,
      functionName: "quoteSend",
      args: [sendParam as any, false],
      //args: [sendParam, false],
    });

    return result;
  }, []);

  const approve = useCallback(async (params: FunctionParams["approve"]) => {
    console.log('Token address:', params.token); // Add this line to debug
    const { request } = await simulateContract(config, {
      abi: USDE_ABI,
      address: params.token,
      functionName: "approve",
      args: [params.spender, params.amount],
    });
    return writeContract(config, request);
  }, []);

  const send = useCallback(async (params: FunctionParams["send"], nativeFee: bigint) => {
    const options = Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes();
    
    const sendParam = {
      dstEid: params.dstEid,
      //to: params.to as `0x${string}`,
      to: params.to,
      amountLD: params.amount,
      minAmountLD: params.minAmount,
      extraOptions: options,
      composeMsg: "0x",
      oftCmd: "0x"
    };

    const { request } = await simulateContract(config, {
      address: USDE_ADAPTER_ADDRESS,
      abi: USDE_ADAPTER_ABI,
      functionName: "send",
      args: [sendParam, { nativeFee, lzTokenFee: BigInt(0) }, params.refundAddress],
      value: nativeFee
    });
    return writeContract(config, request);
  }, []);

  return {
    approve,
    send,
    quoteSend
  };
};

export default useWeb3Bridge;
