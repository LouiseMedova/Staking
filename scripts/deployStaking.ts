import { Staking } from '../typechain'
import {ethers, run} from 'hardhat'
import {delay} from '../utils'
import { dotenv, fs } from "./imports";
const envConfig = dotenv.parse(fs.readFileSync(".env"))
	for (const k in envConfig) {
		process.env[k] = envConfig[k]
	}   
const stakingToken = process.env.STAKING_TOKEN as string;
const rewardToken = process.env.REWARD_TOKEN as string;

async function deployStaking() {
	const Staking = await ethers.getContractFactory('Staking')
	console.log('starting deploying token...')
	const staking = await Staking.deploy(stakingToken, rewardToken, 864000) as Staking
	console.log('Staking deployed with address: ' + staking.address)
	console.log('wait of deploying...')
	await staking.deployed()
	console.log('wait of delay...')
	await delay(25000)
	console.log('starting verify staking...')
	try {
		await run('verify:verify', {
			address: staking!.address,
			contract: 'contracts/Staking.sol:Staking',
			constructorArguments: [ stakingToken, rewardToken, 864000 ],
		});
		console.log('verify success')
	} catch (e: any) {
		console.log(e.message)
	}

}

deployStaking()
.then(() => process.exit(0))
.catch(error => {
	console.error(error)
	process.exit(1)
})