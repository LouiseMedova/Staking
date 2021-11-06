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

let distrbutionTime: number
let rewardPerDay: number
let rewardTotal: number

describe('Staking', () => {
	beforeEach(async () => {
		[user0, user1, user2, user3, user4] = await ethers.getSigners()
		distrbutionTime = 864000;
		rewardTotal = 1000;
		rewardPerDay = 100;
		let Token = await ethers.getContractFactory('Token')
		stakingToken = await Token.deploy('Staking Token', 'STT') as Token
		rewardToken = await Token.deploy('Reward Token', 'RWT') as Token
		let Staking = await ethers.getContractFactory('Staking')
		staking = await Staking.deploy(stakingToken.address, 
			rewardToken.address, 
			rewardTotal, 
			distrbutionTime) as Staking
		
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
		it('should update the produced rewards, tokens per stake and total amount of staked tokens', async() => {
			await staking.stake(1000)
			let expectedRewardProduced = 0;
			let expectedTokensPerStake = 0;
			let expectedTotalStaked = 1000;			
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)
			expect(await staking.tokensPerStake()).to.equal(expectedRewardProduced)
			expect(await staking.totalStaked()).to.equal(expectedTotalStaked)

			let time = 86401;
			await network.provider.send("evm_increaseTime", [time])
			await staking.stake(1000)
			expectedRewardProduced += Math.trunc(rewardTotal*time/distrbutionTime);
			expectedTokensPerStake += Math.trunc(rewardPerDay * (1e20) / expectedTotalStaked);
			expectedTotalStaked += 1000;
			expect(await staking.totalStaked()).to.equal(expectedTotalStaked)
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())

			await network.provider.send("evm_increaseTime", [2*time])
			await staking.stake(2000)
			expectedRewardProduced += Math.trunc(rewardTotal*2*time/distrbutionTime);
			expectedTokensPerStake += Math.trunc(rewardPerDay*2* (1e20) / expectedTotalStaked);
			expectedTotalStaked += 2000;
			expect(await staking.totalStaked()).to.equal(expectedTotalStaked)
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())

			await network.provider.send("evm_increaseTime", [4*time])
			await staking.stake(3000)
			expectedRewardProduced += Math.trunc(rewardTotal*4*time/distrbutionTime);
			expectedTokensPerStake += Math.trunc(rewardPerDay*4* (1e20) / expectedTotalStaked);
			expectedTotalStaked += 3000;
			expect(await staking.totalStaked()).to.equal(expectedTotalStaked)
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())
		})
		
		it('should not update the produced rewards, tokens per stake if not enough time has passed', async () => {
			await staking.stake(1000)
			let expectedRewardProduced = 0;
			let expectedTokensPerStake = 0;
			let expectedTotalStaked = 1000;			
	
			let time = 86401;
			await network.provider.send("evm_increaseTime", [time])
			await staking.stake(1000)
			expectedRewardProduced += Math.trunc(rewardTotal*time/distrbutionTime);
			expectedTokensPerStake += Math.trunc(rewardPerDay * (1e20) / expectedTotalStaked);
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())

			await staking.stake(1000)
			await staking.stake(1000)
			await staking.stake(1000)
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())
		})

		it('should update staker struct', async() => {
			await staking.stake(1000)
			let expectedDebt = 0;
			let tps = 0;
			let expectedBalance = 1000;
			let staker = await staking.stakers(user0.address)
			expect(staker.rewardDebt).to.equal(expectedDebt)
			expect(staker.balance).to.equal(expectedBalance)

			let time = 86401;
			await network.provider.send("evm_increaseTime", [time])
			await staking.stake(1000)
			tps += rewardPerDay/1000;
			expectedDebt += Math.trunc(tps * 1000);
			expectedBalance += 1000;
			staker = await staking.stakers(user0.address)
			expect(staker.rewardDebt).to.equal(expectedDebt)
			expect(staker.balance).to.equal(expectedBalance)

			await network.provider.send("evm_increaseTime", [2*time])
			await staking.stake(2000)
			tps += rewardPerDay*2/2000;
			expectedDebt += Math.trunc(tps * 2000);
			expectedBalance += 2000;
			staker = await staking.stakers(user0.address)
			expect(staker.rewardDebt).to.equal(expectedDebt)
			expect(staker.balance).to.equal(expectedBalance)

			await network.provider.send("evm_increaseTime", [5*time])
			await staking.stake(3000)
			tps += rewardPerDay*5/4000;
			expectedDebt += Math.trunc(tps * 3000);
			expectedBalance += 3000;
			staker = await staking.stakers(user0.address)
			expect(staker.rewardDebt).to.equal(expectedDebt)
			expect(staker.balance).to.equal(expectedBalance)
		})

		it('should revert if amount = 0', async () => {
			await expect(
				staking.stake(0))
					.to
					.be.revertedWith('_amount must be > 0')
		})

		it('should emit `Staked` event', async() => {
			await expect(staking.connect(user0).stake(1000))
				.to.emit(staking, 'Staked')
				.withArgs(
					user0.address,
					1000
				)
			const balance = await stakingToken.balanceOf(staking.address)
			expect(balance).to.equal(1000)
		})

	})

	describe('Withdraw', () => {
		it('should update the produced rewards, tokens per stake and total amount of staked tokens', async() => {
			await staking.stake(10000)
			let expectedRewardProduced = 0;
			let expectedTokensPerStake = 0;
			let expectedTotalStaked = 10000;			
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)
			expect(await staking.tokensPerStake()).to.equal(expectedRewardProduced)
			expect(await staking.totalStaked()).to.equal(expectedTotalStaked)

			let time = 86401;
			await network.provider.send("evm_increaseTime", [time])
			await staking.withdraw(2000)
			expectedRewardProduced += Math.trunc(rewardTotal*time/distrbutionTime);
			expectedTokensPerStake += Math.trunc(rewardPerDay * (1e20) / expectedTotalStaked);
			expectedTotalStaked -= 2000;
			expect(await staking.totalStaked()).to.equal(expectedTotalStaked)
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())
			
			await network.provider.send("evm_increaseTime", [2*time])
			await staking.withdraw(3000)
			expectedRewardProduced += Math.trunc(rewardTotal*2*time/distrbutionTime);
			expectedTokensPerStake += Math.trunc(rewardPerDay*2* (1e20) / expectedTotalStaked);
			expectedTotalStaked -= 3000;

			expect(await staking.totalStaked()).to.equal(expectedTotalStaked)
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())

			await network.provider.send("evm_increaseTime", [4*time])
			await staking.withdraw(1000)
			expectedRewardProduced += Math.trunc(rewardTotal*4*time/distrbutionTime);
			expectedTokensPerStake += Math.trunc(rewardPerDay*4* (1e20) / expectedTotalStaked);
			expectedTotalStaked -= 1000;
			expect(await staking.totalStaked()).to.equal(expectedTotalStaked)
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())
		})
		
		it('should not update the produced rewards, tokens per stake if not enough time has passed', async () => {
			await staking.stake(1000)
			let expectedRewardProduced = 0;
			let expectedTokensPerStake = 0;
			let expectedTotalStaked = 1000;			
	
			let time = 86401;
			await network.provider.send("evm_increaseTime", [time])
			await staking.withdraw(100)
			expectedRewardProduced += Math.trunc(rewardTotal*time/distrbutionTime);
			expectedTokensPerStake += Math.trunc(rewardPerDay * (1e20) / expectedTotalStaked);
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())

			await staking.withdraw(100)
			await staking.withdraw(100)
			await staking.withdraw(100)
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())
		})

		it('should update staker struct', async() => {
			await staking.stake(10000)
			let expectedAllowed = 0;
			let tps = 0;
			let expectedBalance = 10000;
			let staker = await staking.stakers(user0.address)
			expect(staker.rewardAllowed).to.equal(expectedAllowed)
			expect(staker.balance).to.equal(expectedBalance)

			let time = 86401;
			await network.provider.send("evm_increaseTime", [time])
			await staking.withdraw(1000)
			tps += rewardPerDay/10000;
			expectedAllowed  += Math.trunc(tps * 1000);
			expectedBalance -= 1000;
			staker = await staking.stakers(user0.address)
			expect(staker.rewardAllowed).to.equal(expectedAllowed)
			expect(staker.balance).to.equal(expectedBalance)

			await network.provider.send("evm_increaseTime", [2*time])
			await staking.withdraw(2000)
			tps += rewardPerDay*2/9000;
			expectedAllowed  += Math.trunc(tps * 2000);
			expectedBalance -= 2000;
			staker = await staking.stakers(user0.address)
			expect(staker.rewardAllowed).to.equal(expectedAllowed )
			expect(staker.balance).to.equal(expectedBalance)

			await network.provider.send("evm_increaseTime", [5*time])
			await staking.withdraw(3000)
			tps += rewardPerDay*5/7000;
			expectedAllowed  += Math.trunc(tps * 3000);
			expectedBalance -= 3000;
			staker = await staking.stakers(user0.address)
			expect(staker.rewardAllowed).to.equal(expectedAllowed )
			expect(staker.balance).to.equal(expectedBalance)
		})

		it('should revert if amount = 0', async () => {
			await expect(
				staking.withdraw(0))
					.to
					.be.revertedWith('_amount must be > 0')
		})

		it('should revert if user`s balance is less than the withdrawn amount', async () => {
			await staking.stake(10000)
			await expect(
				staking.withdraw(10001))
					.to
					.be.revertedWith('balance of staker must be >= withdrawn amount')
		})

		it('should emit `Withdrawn` event', async() => {
			await staking.stake(10000)
			await expect(staking.withdraw(1000))
				.to.emit(staking, 'Withdrawn')
				.withArgs(
					user0.address,
					1000
				)
		})

	})

	describe('Get rewards', async() => {

		it('should update the produced rewards and tokens per stake', async() => {
			await staking.stake(10000)
			let expectedRewardProduced = 0;
			let expectedTokensPerStake = 0;
			let totalStaked = 10000;			
	
			let time = 86401;
			await network.provider.send("evm_increaseTime", [3*time])
			await staking.getReward()
			expectedRewardProduced += Math.trunc(rewardTotal*3*time/distrbutionTime);
			expectedTokensPerStake += Math.trunc(rewardPerDay*3*(1e20) / totalStaked);
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())

			await network.provider.send("evm_increaseTime", [5*time])
			await staking.getReward()
			expectedRewardProduced += Math.trunc(rewardTotal*5*time/distrbutionTime);
			expectedTokensPerStake += Math.trunc(rewardPerDay*5*(1e20) / totalStaked);
			expect(await staking.rewardProduced()).to.equal(expectedRewardProduced)			
			expect((await staking.tokensPerStake()).toString()).to.equal(expectedTokensPerStake.toString())
		})

		it('should update staker struct', async() => {
			await staking.stake(10000)
			let expectedDistributed = 0;
			let tps = 0;
			let totalAmount = 10000;
			let staker = await staking.stakers(user0.address)
			expect(staker.distributed).to.equal(expectedDistributed)

			let time = 86401;
			await network.provider.send("evm_increaseTime", [2*time])
			await staking.getReward();
			tps += 2*rewardPerDay/totalAmount;
			expectedDistributed  += totalAmount*tps - expectedDistributed;
			staker = await staking.stakers(user0.address)
			expect(staker.distributed).to.equal(expectedDistributed)

			await network.provider.send("evm_increaseTime", [4*time])
			await staking.getReward();
			tps += rewardPerDay*4/totalAmount;
			expectedDistributed  += totalAmount*tps - expectedDistributed;		
			staker = await staking.stakers(user0.address)
			expect(staker.distributed).to.equal(expectedDistributed)
		})

		it('should transfer reward tokens to staker and emit `Reward` event', async() => {
			await staking.connect(user1).stake(10000)

			let time = 86401;
			await network.provider.send("evm_increaseTime", [2*time])
			await expect(staking.connect(user1).getReward())
				.to.emit(staking, 'Reward')
				.withArgs(
					user1.address,
					200
				)

			await network.provider.send("evm_increaseTime", [5*time])
			await expect(staking.connect(user1).getReward())
				.to.emit(staking, 'Reward')
				.withArgs(
					user1.address,
					500
				)

			expect(await rewardToken.balanceOf(user1.address)).to.equal(700)
		})

		it('should transfer nothing if the reward is 0', async() => {
			await staking.connect(user0).stake(10000)

			let time = 86401;
			await network.provider.send("evm_increaseTime", [2*time])
			await staking.connect(user1).stake(5000)
			await staking.connect(user1).getReward()
			expect(await rewardToken.balanceOf(user1.address)).to.equal(0)

		})
	
	})

	describe('Full test', async () => {
		it('should distribute rewards after 10 days', async () => {
			let staker1 = { balance: 0, debt: 0, reward: 0};
			let staker2 = { balance: 0, debt: 0, reward: 0};
			let staker3 = { balance: 0, debt: 0, reward: 0};
			let staker4 = { balance: 0, debt: 0, reward: 0};
			//day 1
			await staking.connect(user1).stake(1000)
			let totalStaked = 1000;
			let tps = 0;
			staker1.balance += 1000;
			staker1.debt += tps*1000;

			//day 2			
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user2).stake(2000) 
			tps += rewardPerDay/totalStaked;
			staker2.debt += tps*2000;
			totalStaked += 2000;
			staker2.balance += 2000;

			//day 3
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user3).stake(2500) 
			tps += rewardPerDay/totalStaked;
			staker3.debt += tps*2500;
			totalStaked += 2500;
			staker3.balance += 2500;

			//day 4
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user1).stake(1500) 
			await staking.connect(user4).stake(5000) 
			tps += rewardPerDay/totalStaked;
			staker1.debt += tps*1500;
			totalStaked += 1500;
			staker1.balance += 1500;

			staker4.debt += tps*5000;
			totalStaked += 5000;
			staker4.balance += 5000;

			//day 5
			await network.provider.send("evm_increaseTime", [86401])

			//day 6
			await network.provider.send("evm_increaseTime", [86401])

			//day7
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user2).stake(5000) 
			await staking.connect(user3).stake(1000) 
			tps += rewardPerDay*3/totalStaked;
			staker2.debt += tps*5000;
			totalStaked += 5000;
			staker2.balance += 5000;

			staker3.debt += tps*1000;
			totalStaked += 1000;
			staker3.balance += 1000;

			//day 8
			await network.provider.send("evm_increaseTime", [86401])
			await staking.connect(user4).stake(30000) 
			tps += rewardPerDay/totalStaked;
			staker4.debt += tps*30000;
			totalStaked += 30000;
			staker4.balance += 30000;

			//day 9
			await network.provider.send("evm_increaseTime", [86401])

			//day 10
			await network.provider.send("evm_increaseTime", [86401])

			//day 11
			await network.provider.send("evm_increaseTime", [86401])

			tps += rewardPerDay*3/totalStaked;
			staker1.reward = tps*staker1.balance - staker1.debt;
			staker2.reward = tps*staker2.balance - staker2.debt;
			staker3.reward = tps*staker3.balance - staker3.debt;
			staker4.reward = tps*staker4.balance - staker4.debt;
			
			console.log(staker1);
			console.log(staker2);
			console.log(staker3);
			console.log(staker4);
			

			await staking.connect(user1).getReward()
			console.log((await rewardToken.balanceOf(user1.address)).toString());

			await staking.connect(user2).getReward()
			console.log((await rewardToken.balanceOf(user2.address)).toString());

			await staking.connect(user3).getReward()
			console.log((await rewardToken.balanceOf(user3.address)).toString());

			await staking.connect(user4).getReward()
			console.log((await rewardToken.balanceOf(user4.address)).toString());

		})
	})
})
