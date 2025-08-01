const { sumTokensExport, getJettonsInfo } = require('../helper/chain/ton')
const { get } = require('../helper/http')
const { transformDexBalances } = require('../helper/portedTokens')
const { address } = require('../helper/utils/ton')
const ADDRESSES = require("../helper/coreAssets.json")

// CES
const CES_MASTER = "0:a5d12e31be87867851a28d3ce271203c8fa1a28ae826256e73c506d94d49edad"
const CES_STAKING_CONTRACT = "0:29f90533937d696105883b981e9427d1ae411eef5b08eab83f4af89c495d27df"
const DEDUST_TON_CES_POOL = "0:123e245683bd5e93ae787764ebf22291306f4a3fcbb2dcfcf9e337186af92c83"
const STONFI_CES_TON_POOL = "0:6a839f7a9d6e5303d71f51e3c41469f2c35574179eb4bfb420dca624bb989753"

// XROCK
const XROCK_MASTER = "0:157c463688a4a91245218052c5580807792cf6347d9757e32f0ee88a179a6549"
const XROCK_STAKING_CONTRACT = "0:c84deaf1d956d5f80be722bbdaeeba33d70d068ace97c6fc23e1bfeb5689e1ca"
const DEDUST_XROCK_USDT_POOL = "0:9cf96b400deedd4143bd113d8d767f0042515e2ad510c4b4adbe734cd30563b8"
const STONFI_XROCK_USDT_POOL = "0:6ba0e19f6adacbefdcbbc859407241eff578f4a57edc8e3e05e86dcfbb283f20"

// JETTON
const JETTON_STAKING_CONTRACT = "0:160d382ed1a373e7e859d1a76b319b4a3e5c8945f26fc8177662ac59a2c67f38"
const JETTON_MASTER = "0:105e5589bc66db15f13c177a12f2cf3b94881da2f4b8e7922c58569176625eb5"
const STONFI_V2_JETTON_TON_POOL = "0:ff5f1fa2411d33dc6268cd0b74744d726e0c01145c9f4f9c9e867c0e244de490"
const DEDUST_JETTON_TON_POOL = "0:f417fc37e424d65314d646379fa15fb8d342910368d7e755f87b3220994518ff"
const STONFI_JETTON_TON_POOL = "0:139eae96db1bf5d02d7d2cd942dbac45b535757dbccc917997402587aadbfa3a"
const DEDUST_JETTON_USDT_POOL = "0:98ac7350eecb80d1f1d690912e2ed5e541e2efff1a722670103f97ed2407f473"
const STONFI_JETTON_USDT_POOL = "0:1b011c80e68e5942aab7e5c79b7b4faacd4999ecda9579df58b3edfbcca414f4"
const STONFI_V2_JETTON_USDT_POOL = "0:46fe73fa794a69f3d6723d10b136dc884061df06e602ccb5d58414306efe5310"

// DFC
const DFC_STAKING_CONTRACT = "0:3acaf26d83f9bff8b88b72434fb6ab23182f5153e7690a07557e9626f8824bab"
const DFC_MASTER = "0:f6eb371de82aa9cfb5b22ca547f31fdc0fa0fbb41ae89ba84a73272ff0bf2157"
const DEDUST_DFC_TON_POOL = "0:84868f284afcd59de33eab700b57d18c3a8473946370ac6b6ae29db1dd29c89c"
const STONFI_DFC_TON_POOL = "0:a66a91222d03b4b9810e9af0de5cd47d8b947891854f126c8d2447304824d251"

const COFFEE_TON_ADDRESS = "native"

module.exports = {
    methodology: "Counts swap.coffee smartcontract balance as TVL.",
    timetravel: false,
    ton: {
        tvl: async () => {
            const pools = await get('https://backend.swap.coffee/v1/dex/pools')

            const jettonIds = [...new Set(
                pools.flatMap(item => [item.tokens[0], item.tokens[1]]).filter(val => val !== COFFEE_TON_ADDRESS)
            )];

            const jettonInfo = await getJettonsInfo(jettonIds)
            const decimals = {[COFFEE_TON_ADDRESS]: 9}
            for (const data of jettonInfo) {
                decimals[address(data.metadata.address).toString()] = parseInt(data.metadata.decimals)
            }

            return await transformDexBalances({
                chain: 'ton',
                data: pools.map(i => ({
                    token0: normalizeAddress(i.tokens[0]),
                    token1: normalizeAddress(i.tokens[1]),
                    token0Bal: i.reserves[0] * (10 ** decimals[i.tokens[0]]),
                    token1Bal: i.reserves[1] * (10 ** decimals[i.tokens[1]]),
                }))
            })
        },
        staking: sumTokensExport({
            owners: [CES_STAKING_CONTRACT, XROCK_STAKING_CONTRACT, JETTON_STAKING_CONTRACT, DFC_STAKING_CONTRACT],
            tokens: [XROCK_MASTER, CES_MASTER, JETTON_MASTER, DFC_MASTER],
            onlyWhitelistedTokens: true
        }),
        pool2: sumTokensExport({
            owners: [CES_STAKING_CONTRACT, XROCK_STAKING_CONTRACT, JETTON_STAKING_CONTRACT, DFC_STAKING_CONTRACT],
            tokens: [
                DEDUST_TON_CES_POOL, STONFI_CES_TON_POOL,

                DEDUST_XROCK_USDT_POOL, STONFI_XROCK_USDT_POOL,

                STONFI_V2_JETTON_TON_POOL, DEDUST_JETTON_TON_POOL, STONFI_JETTON_TON_POOL, DEDUST_JETTON_USDT_POOL,
                STONFI_JETTON_USDT_POOL, STONFI_V2_JETTON_USDT_POOL,

                DEDUST_DFC_TON_POOL, STONFI_DFC_TON_POOL
            ],
            onlyWhitelistedTokens: true
        })
    }
}

function normalizeAddress(addr) {
    return addr === COFFEE_TON_ADDRESS ? ADDRESSES.ton.TON : addr
}