<template>
    <div class='dialog-layer'>
        <el-dialog
            v-model='show'
            :before-close='close'
            :close-on-click-modal='false'
            :title='data.symbolName'
            width='500px'
        >
            <div v-if='show' class='body-module'>
                <div class='row'>
                    <div class='col'>
                        <div class='name'>
                            {{ $t('trade.positionPrice') }}
                        </div>
                        <div class='value'>
                            {{ data.openPrice }}
                        </div>
                    </div>
                    <div class='col'>
                        <div class='name'>
                            {{ $t('trade.currentPrice') }}
                        </div>
                        <div class='value'>
                            <span :class='[Number(data.direction) === 1 ? product?.sell_color : product?.buy_color]'>
                                {{ Number(data.direction) === 1 ? product?.sell_price : product?.buy_price }}
                            </span>
                        </div>
                    </div>
                    <div v-if='product.tradeType === 2' class='col'>
                        <div class='name'>
                            {{ $t('trade.previewStopPrice') }}
                        </div>
                        <div class='value'>
                            {{ data.previewStopPrice || '--' }}
                        </div>
                    </div>
                </div>
                <modifyProfitLoss
                    ref='modifyProfitLossRef'
                    v-model:stopLoss='stopLossPrice'
                    v-model:stopProfit='stopProfitPrice'
                    :direction='data.direction'
                    :order-data='data'
                    :product='product'
                />
                <p class='warn'>
                    <span v-if='warn'>
                        {{ warn }}
                    </span>
                </p>
            </div>
            <template #footer>
                <button v-loading='isSubmit' class='handle-btn' @click='submitHandler'>
                    {{ $t('save') }}
                </button>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { ref, reactive, toRefs, computed, watchEffect } from 'vue'
import { useStore } from 'vuex'
import { equalTo, mul, pow } from '@/utils/calculation'
import { useI18n } from 'vue-i18n'
import { Toast } from 'vant'
import modifyProfitLoss from '@planspc/components/modifyProfitLoss'
import { updateOrder } from '@/api/trade'

export default {
    components: {
        modifyProfitLoss
    },
    setup () {
        const store = useStore()
        const { t } = useI18n({ useScope: 'global' })
        const modifyProfitLossRef = ref(null)
        const state = reactive({
            // ??????????????????
            show: false,
            // ????????????
            isSubmit: false,
            // ????????????
            data: {},
            // ?????????
            stopLossPrice: '',
            // ?????????
            stopProfitPrice: ''
        })
        // ????????????
        const product = computed(() => store.state._quote.productMap[state.data.symbolId + '_' + state.data.tradeType] || {})
        // ????????????
        const accountList = computed(() => store.state._user.customerInfo?.accountList)
        // ????????????
        const account = computed(() => accountList.value.find(item => Number(item.tradeType) === Number(state.data.tradeType)))
        // ????????????
        const warn = computed(() => modifyProfitLossRef.value?.stopLossWarn || modifyProfitLossRef.value?.stopProfitWarn)

        watchEffect(() => {
            if (state.data?.stopLoss > 0) state.stopLossPrice = state.data.stopLossDecimal
            if (state.data?.takeProfit > 0) state.stopProfitPrice = state.data.takeProfitDecimal
        })

        // ????????????
        const open = (row) => {
            store.dispatch('_quote/querySymbolInfo', {
                symbolId: row.symbolId,
                tradeType: row.tradeType
            })

            state.data = row
            state.stopLossPrice = ''
            state.stopProfitPrice = ''
            state.isSubmit = false
            state.show = true
        }

        // ????????????
        const close = () => {
            state.show = false
            store.commit('Update_stopLossPprofitProductID', '')
            state.data = {}
        }

        // ??????????????????????????????
        const submitParams = () => {
            const data = state.data
            if (equalTo(data.takeProfit, state.stopLossPrice) && equalTo(data.stopLoss, state.stopProfitPrice)) {
                Toast(t('trade.unModify'))
                return false
            }
            const p = pow(10, product.value.price_digits)

            const params = {
                orderId: data.orderId,
                positionId: data.positionId,
                stopLoss: !state.stopLossPrice ? 0 : mul(state.stopLossPrice, p),
                takeProfit: !state.stopProfitPrice ? 0 : mul(state.stopProfitPrice, p),
                tradeType: data.tradeType,
                accountId: account.value.accountId,
                accountDigits: account.value.digits
            }
            return params
        }

        // ????????????????????????
        const submitHandler = () => {
            const params = submitParams()
            if (!params) return false
            state.isSubmit = true
            updateOrder(params).then(res => {
                state.isSubmit = false
                if (res.check()) {
                    queryPositionList()
                    Toast(t('trade.modifySuccess'))
                    state.show = false
                    store.commit('Update_stopLossPprofitProductID', '')
                } else {
                    Toast(res.msg)
                }
            }).catch(res => {
                state.isSubmit = false
                Toast(res.msg)
            })
        }

        // ??????????????????
        const queryPositionList = () => {
            const data = state.data
            const accountId = account.value.accountId
            store.dispatch('_trade/queryPositionPage', {
                tradeType: data.tradeType,
                sortFieldName: 'openTime',
                sortType: 'desc',
                accountId
            })
        }

        return {
            ...toRefs(state),
            open,
            close,
            product,
            modifyProfitLossRef,
            warn,
            submitHandler
        }
    }
}
</script>

<style lang="scss" scoped>
.body-module {
    .row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 25px;
        font-size: 14px;
        .col {
            display: inline-flex;
            flex-direction: column;
            .name {
                color: var(--minorColor);
            }
            .value {
                margin-top: 5px;
                span {
                    margin-right: 3px;
                }
            }
        }
    }
    .handle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        .title {
            display: flex;
            flex-direction: column;
            color: var(--minorColor);
            strong {
                font-size: 14px;
            }
            span {
                font-size: 12px;
            }
        }
    }
    .warn {
        display: flex;
        align-items: center;
        height: 40px;
        font-size: 12px;
        color: var(--warn);
    }
}
.handle-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--primary);
    width: 100%;
    height: 48px;
    font-size: 16px;
    color: #fff;
    border-radius: 4px;
    cursor: pointer;
}
</style>
