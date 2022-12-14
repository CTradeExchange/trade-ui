<template>
    <router-view />
    <Loading :show='loading' />
    <div class='header-tabs'>
        <div :class="['item', { 'item-active': activeName === 'overview' }]" @click="switchTabs('overview')">
            <span>Overview</span>
        </div>
        <div :class="['item', { 'item-active': activeName === 'info' }]" @click="switchTabs('info')">
            <span>Your info</span>
        </div>
    </div>
    <div v-if='!loading' class='detail-module'>
        <div class='info-case'>
            <div v-if="activeName === 'overview' || bodyWidth > 768" class='info-case-1'>
                <div class='chain-info'>
                    <div class='left'>
                        <img class='icon' :src='"/images/tokens/"+ fund.thirdCoinCode?.toLowerCase() +".svg"' />
                        <span class='name'>
                            {{ fund.thirdCoinCode }}
                        </span>
                    </div>
                    <div class='right'>
                        <img
                            :src='"/images/markets/"+ fund.marketName?.toLowerCase() +".svg"'
                        />
                        <span>{{ fund.marketName + (fund.networkName ? (' ' + fund.networkName) : '') }} Market</span>
                    </div>
                </div>
                <ul class='chain-row'>
                    <li>
                        <div class='inline'>
                            <span class='label'>
                                Platform
                            </span>
                            <div class='box' @click='toPlatform'>
                                <img class='icon' :src='"/images/tokens/"+ fund.platformName?.toLowerCase() +".svg"' />
                                <span class='value'>
                                    {{ fund.platformName }}
                                </span>
                            </div>
                        </div>
                    </li>
                    <li>
                        <div class='inline'>
                            <div class='label'>
                                <field-popover
                                    content='Annual Percentage Yield (APY) is the projected interest on your deposit after one year.'
                                    :offset='[-10, 8]'
                                    title='APY'
                                />
                            </div>
                            <span class='value'>
                                <span v-if='parseFloat(fund.apy) > 0 && parseFloat(fund.apy) < 0.01'>
                                    &lt; 0.01%
                                </span>
                                <span v-else-if='parseFloat(fund.apy) === 0'>
                                    0%
                                </span>
                                <span v-else>
                                    {{ toFixed(fund.apy) + '%' }}
                                </span>
                            </span>
                        </div>
                    </li>
                    <li>
                        <div class='inline'>
                            <div class='label'>
                                <field-popover
                                    content='Total supplied: Total supplied is the total amount of a cryptocurrency that is supplied to the corresponding platform.'
                                    :offset='[50, 8]'
                                    title='Total supplied'
                                />
                            </div>
                            <span class='value'>
                                <large-number :offset='[50, 8]' :value='fund.savingsScale' />
                            </span>
                        </div>
                    </li>
                    <li>
                        <div class='inline'>
                            <div class='label'>
                                <field-popover
                                    content='Reserve Size is the total value of a cryptocurrency that is reserved for borrowing.'
                                    :offset='[-30, 8]'
                                    title='Reserve size'
                                />
                            </div>
                            <span class='value'>
                                $<large-number :offset='[-50, 8]' :value='fund.reserveSize' />
                            </span>
                        </div>
                    </li>
                    <li>
                        <div class='inline'>
                            <div class='label'>
                                <field-popover
                                    content='Available liquidity is the value of a cryptocurrency that is available for borrowing.'
                                    :offset='[40, 8]'
                                    title='Available liquidity'
                                />
                            </div>
                            <span class='value'>
                                $<large-number :offset='[50, 8]' :value='fund.availableFlowUsd' />
                            </span>
                        </div>
                    </li>
                    <li>
                        <div class='inline'>
                            <div class='label'>
                                <field-popover
                                    content='Utilization rate is being calculated by Total Borrows / Total Liquidity and shows the share of reserve???s total capital that is borrowed.'
                                    :offset='[-30, 8]'
                                    title='Utilization rate'
                                />
                            </div>
                            <span class='value'>
                                {{ toFixed(fund.capitalUseRatio) }}%
                            </span>
                        </div>
                    </li>
                    <li>
                        <div class='inline'>
                            <div class='label'>
                                <field-popover
                                    content='Oracle Price is the price feed of a cryptocurrency that is provided by Chainlink.'
                                    :offset='[50, 8]'
                                    title='Oracle price'
                                />
                            </div>
                            <span class='value'>
                                ${{ fund.price !='' ? formatAmount(fund.price) : '--' }}
                            </span>
                        </div>
                    </li>
                </ul>
            </div>
            <div v-if="bodyWidth > 768 || activeName === 'info'" class='info-case-2'>
                <h3 class='title'>
                    Your info
                </h3>
                <!-- ??????????????? -->
                <div v-if='userAddress' class='have-wallet'>
                    <div v-if='Number(assetBalance) <= 0 && !assetBalanceLoading' class='warn'>
                        Your Ethereum wallet is empty. Purchase or transfer assets
                    </div>
                    <div class='assets'>
                        <div class='label'>
                            <span>Wallet balance</span>
                        </div>
                        <div class='count'>
                            <van-loading v-if='assetBalanceLoading' :color='style.normalColor' :size='16' />
                            <b v-else>
                                {{ formatAmount(walletBalance, 5) }}
                            </b>
                            <span>{{ fund.thirdCoinCode }}</span>
                        </div>
                    </div>
                    <p class='usd-count'>
                        <span>$ {{ toFixed(usdCount) }}</span>
                    </p>
                    <div class='assets'>
                        <div class='label'>
                            <span>Available to purchase</span>
                            <van-popover v-model:show='showAmountPopover' placement='top'>
                                <div class='popover-content'>
                                    <p>This is the total amount that you are able to purchase to in this reserve. You are able to purchase your wallet balance up until the purchase cap is reached.</p>
                                </div>
                                <template #reference>
                                    <van-icon class='info' :color="showAmountPopover ? '#0062FF' : style.normalColor" name='info-o' />
                                </template>
                            </van-popover>
                        </div>
                        <div class='count'>
                            <van-loading v-if='assetBalanceLoading' :color='style.normalColor' :size='16' />
                            <b v-else>
                                {{ formatAmount(assetBalance, 5) }}
                            </b>
                            <span>{{ fund.thirdCoinCode }}</span>
                        </div>
                    </div>
                    <div class='handle'>
                        <button class='default' @click='openPurchaseDialog'>
                            Purchase
                        </button>
                    </div>
                </div>
                <!-- ??????????????? -->
                <div v-else class='not-wallet'>
                    <p class='warn'>
                        Please connect a wallet to view your personal information here.
                    </p>
                    <div class='connect-wallet'>
                        <button @click='startConnect'>
                            Connect wallet
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <!-- ?????? -->
        <div v-show="chartShow && activeName === 'overview'">
            <div class='chart-case'>
                <h3 class='chart-title'></h3>
                <div ref='chartDom' class='chart-box'></div>
            </div>
        </div>
    </div>
    <div v-if='!loading' class='footer-handle'>
        <button v-if='userAddress' class='purchase' @click='openPurchaseDialog'>
            Purchase
        </button>
        <button v-else class='connect' @click='startConnect'>
            Connect wallet
        </button>
    </div>

    <!-- ?????????????????? -->
    <aave-purchase-dialog ref='aavePurchaseDialogRef' @purchaseSuccess='purchaseSuccess' />
</template>

<script setup>
import { computed, watch, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useChart } from './hooks.js'
import { formatAmount, toFixed, mul, pow } from '@/utils/calculation'
import { marketDetail_AVVE, ratesHistory_AVVE } from '@/api/fund'
import { web3Hooks } from '@/plugins/web3/index'
import * as echarts from 'echarts'
import { localGet } from '@/utils/util'
import { useViewport } from '@/utils/hooks/useViewport'
import aavePurchaseDialog from '../components/aave-purchase-dialog.vue'
import largeNumber from '../components/large-number.vue'
import fieldPopover from '../components/field-popover.vue'

const store = useStore()
const route = useRoute()
const style = computed(() => store.state.style)
const userAddress = computed(() => store.state._web3.userAddress)
const { platformCode, assetId, marketId, chainId, decimals, version } = route.query
const {
    executeConnect,
    getUserBalance,
    getWalletBalance
} = web3Hooks()
const { newChart } = useChart()
const { bodyWidth } = useViewport()

// ???????????????????????????USD?????????
const usdCount = computed(() => {
    return walletBalance.value > 0 ? mul(walletBalance.value, fund.value.price) : 0
})
// ??????userAddress
watch(() => userAddress.value, () => {
    getAssetBalance()
})

// ref??????
const aavePurchaseDialogRef = ref(null)
// ????????????????????????
const loading = ref(true)
// ??????????????????
const fund = ref({})
// ????????????
const chartDom = ref(null)
// ??????????????????
const chartLoading = ref(true)
// ???????????????
const connectLoading = ref(false)
// ????????????ETH??????
const isPurchaseETH = ref(false)
// ????????????
const assetBalance = ref(0)
// ?????????????????????
const assetBalanceLoading = ref(true)
// ????????????????????????
const showAmountPopover = ref(false)
// ????????????
const walletBalance = ref(0)
// ???????????????????????????
const activeName = ref('overview')

// ????????????
const chartData = ref(null)
const chartShow = ref(true)

// ??????????????????
const queryfundDetail = () => {
    marketDetail_AVVE({
        platformCode,
        assetId,
        marketId,
        chainId,
        version
    }).then(res => {
        loading.value = false
        fund.value = res.data
        isPurchaseETH.value = ['WETH', 'ETH'].includes(fund.value.thirdCoinCode)
    }).catch(() => {
        loading.value = false
    })
}

// ????????????????????????
const queryRatesHistory = () => {
    ratesHistory_AVVE({
        platformCode,
        assetId,
        marketId,
        chainId,
        version
    }).then(res => {
        const xData = []
        const yData = []
        const len = res.data.length
        const num = 6 * (7 * 4) // ??????6????????????????????????4??????????????????28???????????????168?????????
        const max = len > num ? len - num : 0
        chartData.value = res
        chartShow.value = true
        for (let i = len - 1; i >= max; i--) {
            const item = res.data[i]
            xData.unshift(window.dayjs(item.time).format('YYYY-MM-DD HH:mm:ss'))
            yData.unshift(toFixed(item.liquidityRate * 100))
        }
        const series = [{
            name: 'APY',
            type: 'line',
            showSymbol: false,
            data: yData,
            smooth: true,
            areaStyle: {
                opacity: 0.5,
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                        offset: 0,
                        color: 'rgb(129,213,220)'
                    },
                    {
                        offset: 1,
                        color: 'rgb(234,248,249)'
                    }
                ])
            }
        }]

        // ????????????
        newChart(chartDom.value, [xData, series], {
            'yAxis.ext': '%'
        })

        chartLoading.value = false
    }).catch(error => {
        chartShow.value = false
        chartLoading.value = false
    })
}

// ??????????????????
const getAssetBalance = () => {
    assetBalanceLoading.value = true
    if (isPurchaseETH.value) {
        getUserBalance().then(res => {
            console.log('????????????????????????', res)
            assetBalanceLoading.value = false
            walletBalance.value = res || 0
            if (Number(res)) {
                const result = Number(res) - 0.001
                assetBalance.value = result > 0 ? result : 0
            } else {
                assetBalance.value = 0
            }
        }).catch(err => {
            console.log('????????????????????????', err)
            assetBalanceLoading.value = false
            assetBalance.value = 0
            walletBalance.value = 0
        })
    } else {
        getWalletBalance(chainId, assetId, decimals).then(res => {
            console.log('????????????????????????', res)
            assetBalanceLoading.value = false
            assetBalance.value = res || 0
            walletBalance.value = res || 0
        }).catch(err => {
            console.log('????????????????????????', err)
            assetBalanceLoading.value = false
            assetBalance.value = 0
            walletBalance.value = 0
        })
    }
}

// ???????????????
const toPlatform = () => {
    // window.open(fund.value.platformUrl)
}

// ??????????????????
const openPurchaseDialog = () => {
    aavePurchaseDialogRef.value.open(fund.value)
}

// ????????????
const purchaseSuccess = () => {
    queryfundDetail()
    getAssetBalance()
}

// ????????????
const startConnect = () => {
    executeConnect().then(() => {
        connectLoading.value = false
        getAssetBalance()
    }).catch(() => {
        connectLoading.value = false
    })
}

// ???????????????
const switchTabs = (value) => {
    if (activeName.value !== value) activeName.value = value
}

onMounted(() => {
    // ??????????????????
    if (localGet('walletProvider')) {
        startConnect()
    }
    // ??????????????????
    queryfundDetail()
    // ????????????????????????
    queryRatesHistory()
})
</script>

<style lang="scss" scoped>
@import '../stakingDetail.scss'
</style>
