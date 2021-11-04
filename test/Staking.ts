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

import { Staking, ERC20 } from '../typechain'

let staking: Staking
let token: ERC20

let user0: SignerWithAddress
let user1: SignerWithAddress
let user2: SignerWithAddress
let user3: SignerWithAddress

describe('Staking', () => {
	beforeEach(async () => {
		[user0, user1, user2, user3] = await ethers.getSigners()
		let ERC20 = await ethers.getContractFactory('ERC20')
		token = await ERC20.deploy('Staking Token', 'STT') as ERC20
		let Staking = await ethers.getContractFactory('Staking')
		staking = await Staking.deploy(token.address, token.address, 100, 86400) as Staking
	})

	describe('Stake', () => {
		it('should stake', async () => {
			//await network.provider.send("evm_increaseTime", [86401])
			// await staking.connect(user0).stake(1000)
			
		 	// console.log((await staking.getCurrentReward(user0.address)).toString())
			//  console.log((await staking.tokenPerStake()).toString())
			//  console.log("")
			// await network.provider.send("evm_increaseTime", [86401])

		 	// await staking.connect(user1).stake(2000)
			// console.log((await staking.getCurrentReward(user0.address)).toString())
			// console.log((await staking.tokenPerStake()).toString())
			// console.log("")

			// await network.provider.send("evm_increaseTime", [86401])

			// await staking.connect(user2).stake(2500)
			// console.log((await staking.getCurrentReward(user0.address)).toString())
			// console.log((await staking.tokenPerStake()).toString())
			// console.log("")

			// await network.provider.send("evm_increaseTime", [86401])
			// await staking.connect(user0).stake(1500)
			// await staking.connect(user3).stake(5000)

			// console.log((await staking.getCurrentReward(user0.address)).toString())
			// console.log((await staking.tokenPerStake()).toString())
			// console.log("")

			// await network.provider.send("evm_increaseTime", [86401])
			// await network.provider.send("evm_increaseTime", [86401])
			// await network.provider.send("evm_increaseTime", [86401])
			// await network.provider.send("evm_increaseTime", [86401])

			
			// await staking.connect(user1).stake(5000)
			// await staking.connect(user2).stake(1000)

			// console.log((await staking.getCurrentReward(user0.address)).toString())
			// console.log((await staking.tokenPerStake()).toString())
			// console.log("")

			// await network.provider.send("evm_increaseTime", [86401])
			
			// await staking.connect(user3).stake(30000)

			// console.log((await staking.getCurrentReward(user0.address)).toString())
			// console.log((await staking.tokenPerStake()).toString())
			// console.log("")

			// await network.provider.send("evm_increaseTime", [86401])
			// await network.provider.send("evm_increaseTime", [86401])
			// await network.provider.send("evm_increaseTime", [86401])
			// await network.provider.send("evm_increaseTime", [86401])

			// console.log((await staking.getCurrentReward(user0.address)).toString())
			// console.log((await staking.tokenPerStake()).toString())
			// console.log("")

		})

	})
})
