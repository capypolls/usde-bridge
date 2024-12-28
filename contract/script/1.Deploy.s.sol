// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";

import {TemplateOFTAdapter} from "../src/templateOFTAdapter.sol";
import {TemplateOFT} from "../src/TemplateOFT.sol";

contract DeployOFTAdapter is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address endpointV2 = vm.envAddress("ENDPOINT_V2_OFT_ADAPTER");
        address tokenAddress = vm.envAddress("TOKEN_ADDRESS");
        vm.startBroadcast(deployerPrivateKey);

        TemplateOFTAdapter USDeOFTAdapter = new TemplateOFTAdapter(
            tokenAddress,
            endpointV2,
            vm.addr(deployerPrivateKey)
        );

        TemplateOFTAdapter SUSDeOFTAdapter = new TemplateOFTAdapter(
            tokenAddress,
            endpointV2,
            vm.addr(deployerPrivateKey)
        );

        console.logAddress(address(USDeOFTAdapter));
        console.logAddress(address(SUSDeOFTAdapter));

        vm.stopBroadcast();
    }
}

contract DeployOFT is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address endpointV2 = vm.envAddress("ENDPOINT_V2_OFT");
        vm.startBroadcast(deployerPrivateKey);

        TemplateOFT USDeOFT = new TemplateOFT(
            "USDe",
            "USDe",
            endpointV2,
            vm.addr(deployerPrivateKey)
        );

        TemplateOFT SUSDeOFT = new TemplateOFT(
            "SUSDe",
            "SUSDe",
            endpointV2,
            vm.addr(deployerPrivateKey)
        );

        console.logAddress(address(USDeOFT));
        console.logAddress(address(SUSDeOFT));

        vm.stopBroadcast();
    }
}

// export PRIVATE_KEY=
// export ENDPOINT_V2_OFT_ADAPTER=
// export TOKEN_ADDRESS=
// export ENDPOINT_V2_OFT=

// # Deploy OFT Adapter
// forge script script/1.Deploy.s.sol:DeployOFTAdapter \
// --rpc-url https://sample-rpc.com \
// --broadcast -vvvv

// # Deploy OFT
// forge script script/1.Deploy.s.sol:DeployOFT \
// --rpc-url https://sample-rpc.com \
// --broadcast -vvvv
