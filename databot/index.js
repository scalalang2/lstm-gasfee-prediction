import Web3 from 'web3'
import dotenv from 'dotenv'
import schedule from 'node-schedule'

// configuration
dotenv.config()

let ethUrl = process.env.ETH_URL
let blockNumber = 0
let pending = false
let web3 = new Web3(ethUrl)

async function startDataBot() {
    blockNumber = await web3.eth.getBlockNumber()
    
    // every 5 seconds, fetch ethereum on-chain data
    const job = schedule.scheduleJob('*/5 * * * * *', function(){
        if(blockNumber > 0) {
            if(!pending) {
                let callWithTransaction = true
                pending = true
                web3.eth
                    .getBlock(blockNumber, callWithTransaction)
                    .then(res => {
                        pending = false
                        blockNumber--
                    })
            }
        } else {
            throw new Error("unable to connect ethereum blockchain")
        }
    })
}

// start
startDataBot()