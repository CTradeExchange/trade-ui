<template>
    <div>
        <div class='header-case'>
            <p>
                <span>{{ currency }} {{ $t('deposit.depositRecord') }}</span>
                <span v-if='!showFilter'>
                    ({{ $t('common.last3Months') }})
                </span>
            </p>
            <span v-if='!showFilter' class='link' @click='toRecord'>
                {{ $t('common.allRecord') }}
            </span>
            <div v-else class='filter'>
                <!-- <div class='item'>
                    <el-select
                        v-model='state.type'
                        clearable
                        filterable
                        @change='refresh'
                    >
                        <el-option v-for='item in state.typeList' :key='item.value' :label='item.label' :value='item.value' />
                    </el-select>
                </div> -->
                <div class='item'>
                    <el-select
                        v-model='state.currency'
                        clearable
                        filterable
                        placeholder='Select Currency'
                        @change='refresh'
                    >
                        <el-option v-for='item in state.accountList' :key='item.currency' :label='item.currency' :value='item.all || item.currency' />
                    </el-select>
                </div>
                <div class='item-date'>
                    <el-date-picker
                        v-model='state.timeRange'
                        class='item-date-picker'
                        :end-placeholder="$t('compLang.endTime')"
                        range-separator='-'
                        :shortcuts='shortcuts'
                        :start-placeholder="$t('compLang.startTime')"
                        type='datetimerange'
                        value-format='YYYY-MM-DD HH:mm:ss'
                        @change='selectTime'
                    />
                </div>
            </div>
        </div>
        <div v-loading='state.loading' class='body-case'>
            <el-table ref='tableRef' :cell-style="{ background:'none' }" :data='tableData'>
                <el-table-column :label="$t('deposit.rechargeCurrency')" :min-width='minWidth' prop='depositCurrency' />
                <el-table-column :label="$t('deposit.amount') + '(' + $t('deposit.includeFee') + ')'" :min-width='180' prop='intendAmount' />
                <el-table-column :label="$t('deposit.receiptAmount')" :min-width='minWidth' prop='finalAmount' />
                <el-table-column :label="$t('common.fee')" :min-width='minWidth' prop='depositFee' />
                <el-table-column :label="$t('deposit.payCurrency')" :min-width='minWidth' prop='paymentCurrency' />
                <el-table-column :label="$t('deposit.payAmount')" :min-width='minWidth' prop='fromPaymentAmount'>
                    <template #default='scope'>
                        <span>{{ scope.row.fromPaymentAmount || '--' }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('common.createTime')" :min-width='170' prop='createTime'>
                    <template #default='scope'>
                        <span>{{ formatTime(scope.row.createTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('common.updateTime')" :min-width='170' prop='updateTime'>
                    <template #default='scope'>
                        <span>{{ formatTime(scope.row.updateTime) || '--' }}</span>
                    </template>
                </el-table-column>
                <el-table-column label='TXID' :min-width='minWidth' prop='txid'>
                    <template #header>
                        <div>
                            <span>TXID</span>
                            <van-icon class='info' name='info' @click="showExplain($t('deposit.txid'))" />
                        </div>
                    </template>
                    <template #default='scope'>
                        <p class='txid'>
                            <span>{{ scope.row.txid || '--' }}</span>
                            <button v-if='scope.row.txid' :id="'copy-txid-' + scope.$index" :data-clipboard-text='scope.row.txid' @click="onCopy('#copy-txid-' + scope.$index)">
                                {{ $t('common.copy') }}
                            </button>
                        </p>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('deposit.orderNo')" :min-width='160' prop='proposalNo' />
                <el-table-column :label="$t('common.status')" :min-width='minWidth'>
                    <template #default='scope'>
                        <span class='state'>
                            {{ handleDepositState(scope.row) }}
                        </span>
                    </template>
                </el-table-column>
                <template #empty>
                    <span class='emptyText'>
                        {{ $t('deposit.noneRecordTip1') }}
                    </span>
                </template>
            </el-table>
            <div v-if='tableData.length > 0' class='handle-action'>
                <el-pagination
                    v-model:currentPage='state.current'
                    layout='prev, pager, next, sizes'
                    :page-size='state.size'
                    :page-sizes='[10, 50, 100, 200]'
                    :total='state.total'
                    @current-change='changePage'
                    @size-change='changeSize'
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { getDepositCoinList, queryDepositPageList } from '@/api/user'
import { handleDepositState } from '@/hooks/deposit'
import { ref, reactive, computed, watch, onMounted, defineProps, defineExpose } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { Toast, Dialog } from 'vant'
import Clipboard from 'clipboard'

const route = useRoute()
const router = useRouter()
const store = useStore()
const { query } = route
const { t } = useI18n({ useScope: 'global' })
const props = defineProps({
    // ?????????????????????
    showFilter: {
        type: Boolean,
        default: false
    },
    // ?????????????????????
    currency: {
        type: String,
        default: ''
    },
    // ???????????? 1. ?????? 2.??????
    type: {
        type: String,
        default: ''
    }
})

// ????????????
const customerInfo = computed(() => store.state._user.customerInfo)
// ????????????
const tableData = ref([])
// ??????????????????
const minWidth = ref(140)
// ????????????
const state = reactive({
    // ????????????
    loading: false,
    // ????????????
    tradeType: 5,
    // ???????????????
    currency: query.currency || 'all',
    // ????????????
    accountList: [
        { currency: t('common.all'), all: 'all' }
    ],
    // ????????????
    type: query.type || '2',
    // ??????????????????
    typeList: [
        { label: 'Buy Coin', value: '2' },
        { label: 'Deposit', value: '1' }
    ],
    // ????????????
    startTime: window.dayjs(window.dayjs().subtract(3, 'month').format('YYYY/MM/DD')).valueOf(),
    // ????????????
    endTime: window.dayjs(window.dayjs(new Date()).format('YYYY/MM/DD 23:59:59')).valueOf(),
    // ?????????
    total: 0,
    // ????????????
    timeRange: [],
    // ????????????
    current: 1,
    // ???????????????
    size: 10
})

// ??????????????????????????????
const shortcuts = [
    {
        text: t('common.curToday'),
        value: () => {
            const start = window.dayjs().subtract(1, 'day').format('YYYY/MM/DD 00:00:00')
            const end = window.dayjs(new Date()).format('YYYY/MM/DD 23:59:59')
            return [start, end]
        }
    },
    {
        text: t('common.curWeek'),
        value: () => {
            const start = window.dayjs().subtract(7, 'day').format('YYYY/MM/DD 00:00:00')
            const end = window.dayjs(new Date()).format('YYYY/MM/DD 23:59:59')
            return [start, end]
        }
    },
    {
        text: t('common.curMonth'),
        value: () => {
            const start = window.dayjs().subtract(1, 'month').format('YYYY/MM/DD 00:00:00')
            const end = window.dayjs(new Date()).format('YYYY/MM/DD 23:59:59')
            return [start, end]
        }
    },
    {
        text: t('common.curThreeMonth'),
        value: () => {
            const start = window.dayjs().subtract(3, 'month').format('YYYY/MM/DD 00:00:00')
            const end = window.dayjs(new Date()).format('YYYY/MM/DD 23:59:59')
            return [start, end]
        }
    }
]

// ????????????
const refresh = () => {
    state.current = 1
    state.size = 10
    queryDepositList()
}

// ????????????????????????
const setDefaultTime = () => {
    // ????????????????????????????????????????????????????????????????????????
    let startTime = ''
    const endTime = window.dayjs(new Date()).format('YYYY/MM/DD 23:59:59')
    if (props.showFilter) {
        startTime = window.dayjs().subtract(7, 'day').format('YYYY/MM/DD 00:00:00')
    } else {
        startTime = window.dayjs().subtract(3, 'month').format('YYYY/MM/DD 00:00:00')
    }
    state.timeRange = [startTime, endTime]
    state.startTime = window.dayjs(startTime).valueOf()
    state.endTime = window.dayjs(endTime).valueOf()
}

// ???????????????????????????????????????
const queryDepositCoinList = () => {
    getDepositCoinList({ clientType: 'mobile' }).then(res => {
        state.accountList = res.data.map(el => {
            return { currency: el }
        })
    })
}

// ????????????????????????
const queryDepositList = () => {
    state.loading = true
    queryDepositPageList({
        startTime: state.startTime,
        endTime: state.endTime,
        depositCurrency: state.currency === 'all' ? '' : state.currency,
        current: state.current,
        size: state.size
    }).then(res => {
        state.loading = false
        tableData.value = res.data.records
        state.total = res.data.total
    })
}

// ????????????
const selectTime = () => {
    const value = state.timeRange
    if (value) {
        state.startTime = window.dayjs(value[0]).valueOf()
        state.endTime = window.dayjs(value[1]).valueOf()
    } else {
        state.startTime = null
        state.endTime = null
    }
    refresh()
}

// ????????????
const changePage = (value) => {
    state.current = value
    queryDepositList()
}

// ?????????????????????
const changeSize = (value) => {
    state.size = value
    state.current = 1
    queryDepositList()
}

// ?????????????????????
const toRecord = () => {
    router.push({
        path: '/depositRecord',
        query: {
            type: props.type,
            currency: props.currency
        }
    })
}

// ??????
const onCopy = (id) => {
    const clipboard = new Clipboard(id)
    clipboard.on('success', e => {
        Toast(t('common.copySuccess'))
        // ????????????
        clipboard.destroy()
    })
}

// ????????????
const showExplain = (message) => {
    Dialog.alert({
        message
    })
}

// ??????????????????
watch(() => props.type, () => {
    if (props.type) {
        state.type = props.type
    }
}, { immediate: true })

// ???????????????????????????
watch(() => props.currency, () => {
    if (props.currency) {
        state.currency = props.currency
        // ????????????????????????
        setDefaultTime()
        // ????????????
        refresh()
    }
}, { immediate: true })

onMounted(() => {
    // ????????????????????????
    setDefaultTime()
    // ???????????????????????????????????????
    queryDepositCoinList()
    // ????????????????????????
    if (props.showFilter) {
        queryDepositList()
    }
})

defineExpose({
    refresh
})
</script>

<style lang="scss">
.el-date-table td.end-date .el-date-table-cell__text,
.el-date-table td.start-date .el-date-table-cell__text {
    background: var(--primary);
}
.el-date-table td.available:hover,
.el-date-table td.today .el-date-table-cell__text,
.el-picker-panel__shortcut:hover {
    color: var(--color);
}
.el-time-panel__btn.confirm {
    color: var(--primary);
}
</style>

<style lang="scss" scoped>
.header-case {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 25px;
    background: var(--contentColor);
    border-bottom: 1px solid var(--lineColor);
    .filter {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        .item {
            margin-left: 10px;
            &:deep {
                width: 200px;
            }
        }
        .item-date {
            margin-left: 10px;
        }
    }
    .link {
        color: var(--primary);
        cursor: pointer;
        &:hover {
            text-decoration: underline;
        }
    }
}
.body-case {
    flex: 1;
    padding: 0 20px;
    background: var(--contentColor);
    border-radius: 0 0 10px 10px;
    .info {
        margin-left: rem(8px);
        font-size: rem(34px);
        color: var(--minorColor);
        cursor: pointer;
    }
    .txid {
        display: flex;
        align-items: center;
        span {
            @include ellipsis();
            max-width: 100px;
        }
        button {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            min-width: 40px;
            margin-left: 5px;
            color: var(--primary);
            background-color: transparent;
            cursor: pointer;
            &:hover {
                text-decoration: underline;
            }
        }
    }
}
:deep(.el-table) {
    background-color: transparent;
    &::before {
        background: none;
    }
    .el-checkbox {
        height: auto;
        position: relative;
        top: 3px;
    }
    .el-table__fixed-right::before {
        background: none;
    }
    .el-table__cell.is-right {
        background: var(--contentColor) !important;
    }
    .cell {
        line-height: 16px;
    }
    thead {
        tr {
            height: 50px;
            font-size: 13px;
            color: var(--color);
            background: transparent;
            th {
                font-weight: normal;
                border-bottom: 1px solid var(--lineColor);
                background: transparent;
            }
        }
    }
    tbody {
        tr {
            height: 62px;
            font-size: 14px;
            color: var(--color);
            background: transparent;
            td {
                border-bottom: 1px solid var(--lineColor);
                background: transparent;
            }
        }
    }
    .el-table__body-wrapper {
        @include scroll-pc();
        min-height: 600px;
    }
    .el-table__empty-block {
        min-height: 500px;
    }
    .empty {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        .image {
            width: 160px;
            height: auto;
        }
    }
    .emptyText {
        display: inline-block;
        width: 160px;
        padding-top: 140px;
        background: url('/images/empty.png') center top no-repeat;
        background-size: 160px auto;
        color: var(--placeholdColor);
    }
}
.handle-action {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 60px;
    .btn {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 32px;
        padding: 0 10px;
        margin-right: 20px;
        font-size: 13px;
        color: #FFF;
        background: var(--primary);
        border-radius: 4px;
        cursor: pointer;
        &:hover {
            opacity: 0.9;
        }
        &.disable {
            background: var(--lineColor);
            color: var(--minorColor);
        }
    }
}
</style>
