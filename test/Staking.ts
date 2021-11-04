import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, network} from 'hardhat'
import { expect } from 'chai'

require('@openzeppelin/test-helpers/configure')({
	provider: network.provider,
  });
  
import BigNumber from 'bignumber.js'
BigNumber.config({ EXPONENTIAL_AT: 60 })

import Web3 from 'web3'
// @ts-ignore
const web3 = new Web3(network.provider) as Web3

import { Staking, Token } from '../typechain'

let staking: Staking
let stakingToken: Token
let rewardToken: Token

let user0: SignerWithAddress
let user1: SignerWithAddress
let user2: SignerWithAddress
let user3: SignerWithAddress
let user4: SignerWithAddress

describe('Staking', () => {
	beforeEach(async () => {
		[user0, user1, user2, user3, user4] = await ethers.getSigners()
		let Token = await ethers.getContractFactory('Token')
		stakingToken = await Token.deploy('Staking Token', 'STT') as Token
		rewardToken = await Token.deploy('Reward Token', 'RWT') as Token
		let Staking = await ethers.getContractFactory('Staking')
		staking = await Staking.deploy(stakingToken.address, rewardToken.address, 1000, 864000) as Staking
		
		await stakingToken.transfer(user1.address, 10000);
		await stakingToken.transfer(user2.address, 10000);
		await stakingToken.transfer(user3.address, 40000);
		await stakingToken.transfer(user4.address, 40000);

		await rewardToken.transfer(staking.address, 100000)

		await stakingToken.connect(user0).increaseAllowance(staking.address, 10000);
		await stakingToken.connect(user1).increaseAllowance(staking.address, 10000);
		await stakingToken.connect(user2).increaseAllowance(staking.address, 10000);
		await stakingToken.connect(user3).increaseAllowance(staking.address, 10000);
		await stakingToken.connect(user4).increaseAllowance(staking.address, 40000);

	})

	describe('Stake', () => {
		it('should stake tokens', async() => {
			await expect(staking.connect(user0).stake(1000))
				.to.emit(staking, 'Staked')
				.withArgs(
					user0.address,
					1000
				)
			const balance = await stakingToken.balanceOf(staking.address)
			expect(balance).to.equal(1000)
		})
		it('should distribute rewards', async () => {
			//day 1
			await staking.connect(user1).stake(1000)
		
			//day 2			
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user2).stake(2000) 

			//day 3
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user3).stake(2500) 

			//day 4
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user1).stake(1500) 
			await staking.connect(user4).stake(5000) 

			//day 5
			await network.provider.send("evm_increaseTime", [86401])

			//day 6
			await network.provider.send("evm_increaseTime", [86401])

			//day7
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user2).stake(5000) 
			await staking.connect(user3).stake(1000) 

			//day 8
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user4).stake(30000) 

			//day 9
			await network.provider.send("evm_increaseTime", [86401])

			//day 10
			await network.provider.send("evm_increaseTime", [86401])

			//day 11
			await network.provider.send("evm_increaseTime", [86401])
			
			await staking.connect(user1).getReward()
			console.log((await rewardToken.balanceOf(user1.address)).toString());

			await staking.connect(user2).getReward()
			console.log((await rewardToken.balanceOf(user2.address)).toString());

			await staking.connect(user3).getReward()
			console.log((await rewardToken.balanceOf(user3.address)).toString());

			await staking.connect(user4).getReward()
			console.log((await rewardToken.balanceOf(user4.address)).toString());

		})

		it('should withdraw', async () => {
			await staking.connect(user1).stake(1000)
		
			//day2			
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user2).stake(1000)

			await staking.connect(user1).getReward()
			console.log((await rewardToken.balanceOf(user1.address)).toString());
			

			//day3
			await network.provider.send("evm_increaseTime", [86401])
	//		await staking.connect(user1).withdraw(500) 
			await staking.connect(user2).stake(500)
			await staking.connect(user1).getReward()
			console.log((await rewardToken.balanceOf(user1.address)).toString());
			
			await staking.connect(user1).withdraw(500) 

			//day4
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user1).getReward()
			console.log((await rewardToken.balanceOf(user1.address)).toString());
			
			
		})

	})
})
