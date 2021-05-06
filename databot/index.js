import Web3 from 'web3'
import dotenv from 'dotenv'
import schedule from 'node-schedule'
import fs from 'fs'
import Big from 'big.js'
import { createObjectCsvWriter } from 'csv-writer'


// configuration
dotenv.config()

const csvWriter = createObjectCsvWriter({
    path: 'data.csv',
    append: true,
    header: [
      {id: 'blockNumber', title: 'blockNumber'},
      {id: 'timestamp', title: 'timestamp'},
      {id: 'gasUsed', title: 'gasUsed'},
      {id: 'size', title: 'size'},
      {id: 'averageGasPrice', title: 'averageGasPrice'},
    ]
  });
  

let ethUrl = process.env.ETH_URL
let pending = false
let web3 = new Web3(ethUrl)

function saveBlockNunmber(blockNumber) {
    fs.writeFile('blockNumber.txt', blockNumber, err => {
        console.error(err)
    })
}

function readBlockNumber() {
    return new Promise((resolve, reject) => {
        fs.readFile('blockNumber.txt', (err, buf) => {
            if(err) {
                reject(err);
            } else {
                resolve(buf.toString())
            }
        })
    })
}

function saveFeatures(block) {
    let averageGasPrice = Big(0);
    let gwei = Big('1000000000')
    for(var i = 0; i < block.transactions.length; i++) {
        let tx = block.transactions[i];
        averageGasPrice = averageGasPrice.add(Big(tx.gasPrice).div(gwei))
    }
    averageGasPrice = averageGasPrice.div(Big(block.transactions.length));

    var data = {
        blockNumber: block.number,
        timestamp: block.timestamp,
        gasUsed: block.gasUsed,
        size: block.size,
        averageGasPrice: Number(averageGasPrice.toFixed(3))
    }

    csvWriter.writeRecords([data]).then(res => {
        console.log(`write, ${block.number} block`)
    })
}

/* 
    features
    - average gas price
    - blockNumber
    - timestamp
    - size
    - gasUsed
*/
async function startDataBot() {
    // fetch latest block number
    var blockNumber;
    try {
        blockNumber = await readBlockNumber();
    } catch {
        blockNumber = await web3.eth.getBlockNumber()
    }
    
    // every 5 seconds, fetch ethereum on-chain data
    const job = schedule.scheduleJob('*/1 * * * * *', function(){
        if(blockNumber > 0) {
            if(!pending) {
                let callWithTransaction = true
                pending = true
                web3.eth
                    .getBlock(blockNumber, callWithTransaction)
                    .then(res => {
                        pending = false
                        blockNumber--
                        saveFeatures(res)
                        saveBlockNunmber(String(blockNumber))
                    })
            }
        } else {
            throw new Error("unable to connect ethereum blockchain")
        }
    })
}

// start
startDataBot()