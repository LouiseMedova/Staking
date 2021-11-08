// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './Token.sol';

 
contract Staking is ReentrancyGuard, AccessControl{
    bytes32 public constant ADMIN = keccak256("ADMIN");
    struct Staker {
        uint balance;
        uint rewardAllowed;
        uint rewardDebt;
        uint distributed;
    } 

    event Staked (
        address staker,
        uint amount
    ); 

    event Withdrawn (
        address staker,
        uint amount
    );

    event Reward (
        address staker,
        uint reward
    );

    mapping(address => Staker) public stakers;

    uint public tokensPerStake;

    uint public totalStaked;

    uint public distributionTime;
    uint public rewardProduced;
    uint public rewardTotal;
    uint public allProduced;
    
    address public stakingToken;
    address public rewardToken;
    uint public producedTime;

    constructor(address _stakingToken, address _rewardToken, uint _distributionTime) {
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
        distributionTime = _distributionTime;
        producedTime = block.timestamp;
        _setupRole(ADMIN, msg.sender);        
    }

    function setRewardTotal(uint _rewardTotal) onlyRole(ADMIN) external {
        require(_rewardTotal > 0, '_rewardTotal must be > 0');
        require(Token(rewardToken).balanceOf(address(this)) >= _rewardTotal, 'The contract must have enough reward tokens');
        update();
        allProduced = rewardProduced;
        producedTime = block.timestamp;
        rewardTotal = _rewardTotal;
    }

    function stake (uint _amount) nonReentrant external {
        require(_amount > 0, '_amount must be > 0');
        update();
        Staker storage staker = stakers[msg.sender];
        staker.rewardDebt += (_amount * tokensPerStake) / (1e20);
        staker.balance += _amount;
        totalStaked += _amount;
        Token(stakingToken).transferFrom(msg.sender, address(this), _amount);
        emit Staked(msg.sender, _amount);
    }

    function withdraw (uint _amount) nonReentrant external {
        require(_amount > 0, '_amount must be > 0');
        Staker storage staker = stakers[msg.sender];
        require(staker.balance >= _amount, 'balance of staker must be >= withdrawn amount');
        update();
        staker.rewardAllowed +=  (_amount * tokensPerStake) / (1e20);
        staker.balance -= _amount;
        totalStaked -= _amount;
        Token(stakingToken).transfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount);
    }

    function getReward() nonReentrant external {
         update();
         uint reward = calcReward(msg.sender,  tokensPerStake);
         if (reward > 0) {
            stakers[msg.sender].distributed += reward;
            Token(rewardToken).transfer(msg.sender, reward);
            emit Reward(msg.sender, reward);
         }
    }

    function update() internal {
        uint rewardProducedAtNow = produced();
        if(rewardProducedAtNow > rewardProduced) {
            uint producedNew = rewardProducedAtNow - rewardProduced;
            if( totalStaked > 0) {
                tokensPerStake += producedNew * 1e20 / totalStaked;
            }
            rewardProduced += producedNew;
        }
    }

    function calcReward(address _staker, uint _tps) 
        private 
        view 
        returns (uint reward) {
            Staker storage staker = stakers[_staker];
            reward = (staker.balance*_tps)/(1e20) + staker.rewardAllowed - staker.rewardDebt - staker.distributed;
        }

    function produced() private view returns (uint) {
        return allProduced + rewardTotal * (block.timestamp - producedTime) / distributionTime;
    }
    
    function getRewardOfStaker(address _staker) 
        public 
        view 
        returns(uint reward) {
            uint rewardProducedAtNow = produced();
            uint _tps = tokensPerStake;
            if(rewardProducedAtNow > rewardProduced && totalStaked > 0) {
                uint producedNew = rewardProducedAtNow - rewardProduced;
                _tps +=  producedNew * 1e20 / totalStaked;
            }
            reward = calcReward(_staker, _tps); 
    }

    function getStakerInfo(address _staker)
        public
        view
        returns(Staker memory staker) {
            staker = stakers[_staker];
        }
}
