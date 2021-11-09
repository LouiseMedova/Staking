import { task } from 'hardhat/config'
const dotenv = require('dotenv')
const fs = require('fs')

const envConfig = dotenv.parse(fs.readFileSync(".env"))
			for (const k in envConfig) {
				process.env[k] = envConfig[k]
			} 
const stakingToken = process.env.STAKING_TOKEN as string;
const rewardToken = process.env.REWARD_TOKEN as string;
const staking = process.env.STAKING as string;

task('setReward', 'Sets the reward to be distributed within distribution time')
	.addParam('reward', 'The value of the distributed reward')
	.setAction(async ({ reward }, { ethers }) => {	  
		const contract = await ethers.getContractAt('Staking', staking)
        await contract.setRewardTotal(reward);
	})

task('stake', 'Stakes the tokens')
	.addParam('amount', 'The number of staked tokens')
	.setAction(async ({ amount }, { ethers }) => {	  
		const contract = await ethers.getContractAt('Staking', staking)
        await contract.stake(amount);
	})

task('withdraw', 'Withdraws the staked the tokens')
	.addParam('amount', 'The number of withdrawn tokens')
	.setAction(async ({ amount }, { ethers }) => {	  
		const contract = await ethers.getContractAt('Staking', staking)
        await contract.withdraw(amount);
	})

task('getStakerInfo', 'Returns the information about staker')
	.addParam('user', 'The staker address')
	.setAction(async ({ user }, { ethers }) => {	  
		const contract = await ethers.getContractAt('Staking', staking)
        const staker = await contract.getStakerInfo(user);
        console.log("Balance:", staker.balance.toString());
        console.log("rewardAllower:", staker.rewardAllowed.toString());
        console.log("rewardDebt:", staker.rewardDebt.toString());
        console.log("distributed:", staker.distributed.toString());
	})

task('getReward', 'Sends reward to the staker')
	.setAction(async ({ }, { ethers }) => {	  
		const contract = await ethers.getContractAt('Staking', staking)
        await contract.getReward();
	})

task('getRewardOfStaker', 'Returns the value of the reward  that is currently avaiable')
    .addParam('user', 'The staker address')
	.setAction(async ({ user }, { ethers }) => {	  
		const contract = await ethers.getContractAt('Staking', staking)
        const reward = await contract.getRewardOfStaker(user);
        console.log("Reward: ", reward.toString());
        
	})