// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
 
contract Staking is ReentrancyGuard{
    
    struct Staker{
        uint balance;
        uint missedRewards;
    } 

    mapping(address => Staker) public stakers;

    uint public tps;
    uint public savedTps;
    uint public savedTime;
    uint public totalStaked;
    uint public dailyReward;
    uint public duration;
    uint public updateTime;
    address public stakingToken;
    address public rewardToken;

    constructor(address _stakingToken, address _rewardToken, uint _dailyReward, uint _duration) {
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
        updateTime = block.timestamp;
        dailyReward = _dailyReward;
        duration = _duration;
    }

    function stake (uint _amount) external {
        require(_amount > 0, '_amount must be > 0');
        Staker storage staker = stakers[msg.sender];
        staker.balance += _amount;
        staker.missedRewards += _amount * tps;
        totalStaked += _amount;
        update();
        ERC20(stakingToken).transferFrom(msg.sender, address(this), _amount);
    }

    function getCurrentReward(address _staker) public view returns(uint) {
        return  (tps * stakers[_staker].balance - stakers[_staker].missedRewards) / (1e20);
    }

    function update() internal {
        uint passedTime = (block.timestamp - updateTime)/(duration);
        if(passedTime >  0) {
            savedTps = tps;
            savedTime = passedTime;
            updateTime = block.timestamp;
        }
        tps = (savedTps*savedTime) + (1e20 * dailyReward) / totalStaked;
    }
}
