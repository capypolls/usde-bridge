// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {OptionsBuilder} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";
import {OFT} from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import {SendParam, OFTReceipt} from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";
import {MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

contract SendToken is Script {
    using OptionsBuilder for bytes;

    function run() public {
        uint256 eid = vm.envUint("EID");
        address oftAddress = vm.envAddress("OFT_ADDRESS");
        address tokenAddress = vm.envAddress("TOKEN_ADDRESS");
        address toAddress = vm.envAddress("TO_ADDRESS");
        uint256 tokensToSend = vm.envUint("TOKENS_TO_SEND");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        OFT sourceOFT = OFT(oftAddress);
        IERC20 token = IERC20(tokenAddress);

        uint256 allowance = token.allowance(address(this), address(sourceOFT));
        console.log("Current allowance:", allowance);

        if (allowance < tokensToSend) {
            token.approve(address(sourceOFT), tokensToSend);
            console.log("Approval successful");
        }

        bytes memory _extraOptions = OptionsBuilder
            .newOptions()
            .addExecutorLzReceiveOption(65000, 0);

        SendParam memory sendParam = SendParam(
            uint32(eid),
            addressToBytes32(toAddress),
            tokensToSend,
            tokensToSend,
            _extraOptions,
            "",
            ""
        );

        MessagingFee memory fee = sourceOFT.quoteSend(sendParam, false);
        console.log("Fee amount: ", fee.nativeFee);

        sourceOFT.send{value: fee.nativeFee}(sendParam, fee, msg.sender);

        vm.stopBroadcast();
    }

    /**
     * @dev Converts an address to bytes32.
     * @param _addr The address to convert.
     * @return The bytes32 representation of the address.
     */
    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
}

// export EID=
// export OFT_ADDRESS=
// export TOKEN_ADDRESS=
// export TO_ADDRESS=
// export TOKENS_TO_SEND=
// export PRIVATE_KEY=

// forge script script/3.SendTokens.s.sol:SendToken \
// --rpc-url https://sample-rpc.com \
// --broadcast -vvvv
