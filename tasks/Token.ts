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

task('getBalance', 'Balance of user')
	.addParam('user', 'The address of the user')
	.setAction(async ({ user }, { ethers }) => {	  
		const contract = await ethers.getContractAt('Token', stakingToken)
        const balance = await contract.balanceOf(user);
		console.log(balance.toString());
	})

task('transfer', 'transfer tokens')
    .addParam('amount', 'the amount of tokens')
	.setAction(async ({ amount }, { ethers }) => {
		const contract = await ethers.getContractAt('Token', rewardToken)
        await contract.transfer(staking, amount);
	})

task('approve', 'approve tokens')
    .addParam('amount', 'the amount of tokens')
	.setAction(async ({  amount }, { ethers }) => {
		const contract = await ethers.getContractAt('Token', stakingToken)
        await contract.approve(staking, amount);
	})
