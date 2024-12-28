// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import {OFT} from "@layerzerolabs/oft-evm/contracts/OFT.sol";

contract SetPeer is Script {
    function run() public {
        address oftAddress = vm.envAddress("OFT_ADDRESS");
        uint256 destinationEid = vm.envUint("DESTINATION_EID");
        address destinationOft = vm.envAddress("DESTINATION_OFT");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        OFT sourceOFT = OFT(oftAddress);

        bool isPeer = sourceOFT.isPeer(
            uint32(destinationEid),
            addressToBytes32(destinationOft)
        );

        if (isPeer) {
            console.log("Peer already set to:", destinationOft);
            return;
        }

        sourceOFT.setPeer(
            uint32(destinationEid),
            addressToBytes32(destinationOft)
        );

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

// export OFT_ADDRESS=
// export DESTINATION_EID=
// export DESTINATION_OFT=
// export PRIVATE_KEY=

// forge script script/2.SetPeer.s.sol:SetPeer \
// --rpc-url https://sample-rpc.com \
// --broadcast -vvvv
