// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

interface IMagnifyCashSBT {
    function tokenByAccount(address _account) external returns (uint256 tokenID);
}
