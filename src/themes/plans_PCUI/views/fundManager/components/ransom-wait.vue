<template>
    <div class='header-case'>
        <div class='filter'>
            <div class='item'>
                <el-input v-model='searchParams.proposalNoList' clearable :placeholder="$t('fundManager.ransom.orderNo')" />
            </div>
            <div class='item'>
                <el-select
                    v-model='searchParams.customerCompanyId'
                    clearable
                    filterable
                    :placeholder="$t('fundManager.ransom.woName')"
                >
                    <el-option v-for='item in companyList' :key='item.id' :label='item.name' :value='item.id' />
                </el-select>
            </div>
            <div class='item'>
                <el-input v-model='searchParams.customerNoList' clearable :placeholder="$t('fundManager.ransom.customerNo')" />
            </div>
            <div class='item fixedWidth'>
                <el-select
                    v-model='searchParams.currencyRedeem'
                    clearable
                    filterable
                    :placeholder="$t('fundManager.ransom.receiveCurrency')"
                >
                    <el-option v-for='item in purchaseCurrencySetting' :key='item.currencyCode' :label='item.currencyName' :value='item.currencyCode' />
                </el-select>
            </div>
            <div class='item-date'>
                <el-date-picker
                    v-model='timeRange'
                    :end-placeholder="$t('compLang.endTime')"
                    range-separator='-'
                    :start-placeholder="$t('compLang.startTime')"
                    type='datetimerange'
                    value-format='YYYY-MM-DD HH:mm:ss'
                    @change='selectTime'
                />
            </div>
            <button class='btn' @click='onSearch'>
                {{ $t('compLang.search') }}
            </button>
        </div>
    </div>
    <div v-loading='isLoading' class='body-case'>
        <el-table ref='tableRef' :cell-style="{ background:'none' }" :data='tableData' :empty-text="$t('c.noData')" @selection-change='selectionChange'>
            <el-table-column type='selection' width='50' />
            <el-table-column :label="$t('fundManager.ransom.orderNo')" :min-width='140' prop='proposalNo' />
            <el-table-column :label="$t('fundManager.ransom.woName')" :min-width='minWidth' prop='companyName' />
            <el-table-column :label="$t('fundManager.ransom.customerNo')" :min-width='minWidth' prop='customerNo' />
            <el-table-column :label="$t('fundManager.ransom.lot')" :min-width='minWidth'>
                <template #default='scope'>
                    <span>{{ scope.row.shares }}{{ scope.row.currencyShares }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.ransom.receiveCurrency')" :min-width='160'>
                <template #default='scope'>
                    <span v-if="scope.row.currencyRedeem==='self'">
                        {{ $t('fundInfo.basketAssets') }}
                    </span>
                    <span v-else>
                        {{ scope.row.currencyRedeem }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.ransom.status')" :min-width='160'>
                <template #default='scope'>
                    <span>{{ $t('fundManager.confirmStatus.' + scope.row.sharesStatus) }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.ransom.applyTime')" :min-width='156' prop='createTime'>
                <template #default='scope'>
                    <span>{{ formatTime(scope.row.createTime) }}</span>
                </template>
            </el-table-column>
            <template #empty>
                <span class='emptyText'>
                    {{ $t('c.noData') }}
                </span>
            </template>
        </el-table>
        <div v-if='tableData.length > 0' class='handle-action'>
            <div class='left'>
                <button :class="['btn', { 'disable': disableBtn }]" @click='openLotDialog("preview")'>
                    {{ $t('fundManager.ransom.preview') }}
                </button>
                <button :class="['btn', { 'disable': disableBtn }]" @click='openLotDialog("confirm")'>
                    {{ $t('fundManager.ransom.confirmLot') }}
                </button>
                <!-- <template v-if='!disableBtn'>
                    <span>{{ $t('fundManager.ransom.totalLot') }}: {{ totalLot }} {{ currency }}</span>
                    <span>{{ $t('assets.free') }}: {{ usable }} {{ currency }}</span>
                </template> -->
            </div>
            <el-pagination
                v-model:currentPage='searchParams.current'
                layout='prev, pager, next, sizes'
                :page-size='searchParams.size'
                :page-sizes='[10, 50, 100, 200]'
                :total='total'
                @current-change='changePage'
                @size-change='changeSize'
            />
        </div>
    </div>

    <!-- ?????????????????? -->
    <lot-dialog ref='lotDialogRef' :type='lotDialogType' @confirm='onConfirm' />
</template>

<script setup>
import lotDialog from './lot-dialog.vue'
import { getCompanyList, getCompanyAssets, getFundRedeemList, getFundRedeemMoney, getFundInfoByCustomerNo } from '@/api/fund'
import { ElInput, ElDatePicker } from 'element-plus'
import { Toast } from 'vant'
import { onMounted, ref, reactive, watch, computed, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

const store = useStore()
const { t } = useI18n({ useScope: 'global' })
// ????????????
const customerInfo = computed(() => store.state._user.customerInfo)
// ??????
const usable = computed(() => {
    if (currency.value && currency.value !== 'self') {
        const accountList = customerInfo.value?.accountList.filter(el => Number(el.tradeType) === 5)
        const account = accountList.find(el => el.currency === currency.value)
        return Number(account.available)
    }
    return ''
})
// ????????????
const isLoading = ref(false)
// ????????????
const companyList = ref([])
// ????????????
const assetsList = ref([])
// ????????????
const tableRef = ref(null)
// ??????????????????
const lotDialogRef = ref(null)
// ????????????
const lotDialogType = ref('preview') // preview ??????  confirm ????????????
// ???????????????
const timeRange = ref(null)
// ????????????
const searchParams = reactive({
    // ????????????
    sharesStatus: 0,
    // ?????????
    proposalNoList: '',
    // ????????????
    customerCompanyId: '',
    // ????????????
    customerNoList: '',
    // ??????????????????
    currencyRedeem: '',
    // ????????????
    startTime: null,
    // ????????????
    endTime: null,
    // ??????????????????
    current: 1,
    // ????????????
    size: 10
})
// ????????????
const tableData = ref([])

// ??????????????????
const minWidth = ref(130)
// ??????????????????
const total = ref(100)
// ?????????????????????
const selectList = ref([])
// ??????????????????????????????
const disableBtn = ref(true)
// ???????????????
const totalLot = ref(0)
// ????????????
const currency = ref('')

// ???????????????????????????
watch(selectList, () => {
    disableBtn.value = selectList.value.length === 0
})

// ??????????????????
const queryCompanyList = () => {
    getCompanyList().then(res => {
        companyList.value = res.data
    })
}
// ????????????????????????
const queryAssetsList = () => {
    getCompanyAssets({
        companyId: customerInfo.value.companyId
    }).then(res => {
        assetsList.value = res.data
    })
}
// ????????????????????????
const queryFundRedeemList = () => {
    const params = Object.assign({}, searchParams)
    params.proposalNoList = params.proposalNoList ? params.proposalNoList.split(',') : null
    params.customerNoList = params.customerNoList ? params.customerNoList.split(',') : null
    params.customerCompanyId = params.customerCompanyId || null
    isLoading.value = true
    getFundRedeemList(params).then(res => {
        isLoading.value = false
        if (res.check()) {
            const { data } = res
            tableData.value = data.records
            total.value = data.total
        }
    }).catch(() => {
        isLoading.value = false
    })
}
// ?????????????????????????????????
const queryFundRedeemMoney = () => {
    const ids = selectList.value.map(elem => elem.id)
    getFundRedeemMoney({
        fundIdList: ids
    }).then(res => {
        if (res.check()) {
            const { data } = res
            totalLot.value = Number(data.sharesTotal)
        }
    })
}
// ????????????
const selectTime = () => {
    const value = timeRange.value
    if (value) {
        searchParams.startTime = window.dayjs(value[0]).valueOf()
        searchParams.endTime = window.dayjs(value[1]).valueOf()
    } else {
        searchParams.startTime = null
        searchParams.endTime = null
    }
}
// ??????????????????
const changePage = (value) => {
    searchParams.current = value
    queryFundRedeemList()
}
// ??????????????????
const changeSize = (value) => {
    searchParams.current = 1
    searchParams.size = value
    queryFundRedeemList()
}
// ????????????
const onSearch = () => {
    searchParams.current = 1
    queryFundRedeemList()
}
// ????????????
const selectionChange = (list) => {
    selectList.value = list
    if (list.length > 0) {
        // ?????????????????????????????????
        // queryFundRedeemMoney()
        currency.value = list[0].currencyRedeem
    } else {
        totalLot.value = 0
        currency.value = ''
    }
}
// ????????????????????????
const openLotDialog = async (type = 'preview') => {
    if (disableBtn.value) return
    // if (Number(totalLot.value) > Number(usable.value)) {
    //     return Toast(t('fundManager.ransom.tip1'))
    // }
    const ids = selectList.value.map(elem => elem.id)
    lotDialogType.value = type
    await nextTick()
    lotDialogRef.value.open(ids)
}
// ????????????
const onConfirm = () => {
    selectList.value = []
    tableRef.value.clearSelection()
    searchParams.current = 1
    queryFundRedeemList()
    // ??????????????????
    store.dispatch('_user/findCustomerInfo', false)
}
const purchaseCurrencySetting = ref([]) // ??????????????????
// ????????????????????????
const getFundInfo = () => {
    getFundInfoByCustomerNo().then(res => {
        if (res.check()) {
            purchaseCurrencySetting.value = res.data.purchaseCurrencySetting.map(el => {
                return {
                    ...el,
                    currencyName: el.currencyCode === 'self' ? t('fundManager.buy.basketAssets') : el.currencyName
                }
            })
        }
    })
}

onMounted(() => {
    // ??????????????????
    queryCompanyList()
    // ????????????????????????
    queryAssetsList()
    // ????????????????????????
    queryFundRedeemList()
    // ????????????????????????
    getFundInfo()
})
</script>

<style lang="scss" scoped>
@import '../index.scss';
</style>
