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
        <el-table ref='tableRef' :cell-style="{ background:'none' }" :data='tableData' :empty-text="$t('c.noData')">
            <el-table-column :label="$t('fundManager.ransom.orderNo')" :min-width='140' prop='proposalNo' />
            <el-table-column :label="$t('fundManager.ransom.woName')" :min-width='minWidth' prop='companyName' />
            <el-table-column :label="$t('fundManager.ransom.customerNo')" :min-width='minWidth' prop='customerNo' />
            <el-table-column :label="$t('fundManager.ransom.lot')" :min-width='minWidth'>
                <template #default='scope'>
                    <span>{{ scope.row.shares }}{{ scope.row.currencyShares }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.ransom.receiveCurrency')" :min-width='150'>
                <template #default='scope'>
                    <span v-if="scope.row.currencyRedeem==='self'">
                        {{ $t('fundInfo.basketAssets') }}
                    </span>
                    <span v-else>
                        {{ scope.row.currencyRedeem }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.ransom.networth')" :min-width='150'>
                <template #default='scope'>
                    <span>{{ scope.row.sharesNet }}{{ scope.row.currencyNet }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.ransom.fees')" :min-width='150'>
                <template #default='scope'>
                    <a v-if="scope.row.currencyRedeem==='self'" class='link' href='javascript:;' @click='showSelfFeesDialog(scope.row, "fee")'>
                        {{ $t('common.look') }}
                    </a>
                    <span v-else>
                        {{ scope.row.fees }}{{ scope.row.currencyRedeem }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.ransom.moneyTotal')" :min-width='150'>
                <template #default='scope'>
                    <a v-if="scope.row.currencyRedeem==='self'" class='link' href='javascript:;' @click='showSelfFeesDialog(scope.row, "amount")'>
                        {{ $t('common.look') }}
                    </a>
                    <span v-else>
                        {{ scope.row.amountRedeem }}{{ scope.row.currencyRedeem }}
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
            <el-table-column :label="$t('fundManager.ransom.lastTime')" :min-width='156' prop='updateTime'>
                <template #default='scope'>
                    <span>{{ formatTime(scope.row.updateTime) }}</span>
                </template>
            </el-table-column>
            <template #empty>
                <span class='emptyText'>
                    {{ $t('c.noData') }}
                </span>
            </template>
        </el-table>
        <div v-if='tableData.length > 0' class='handle-action'>
            <span></span>
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
    <!-- ???????????????????????? -->
    <ransomSelfFeesDialog
        ref='buyDialogRef'
        v-model='selfFeesDialogShow'
        :data='selfFeesDialogData'
        :th-list='selfFeesDialogTHList'
        :title='selfFeesDialogTitle'
        :type='selfFeesDialogType'
    />
</template>

<script setup>
import ransomSelfFeesDialog from './ransom-selfFees-dialog.vue'
import { getCompanyList, getCompanyAssets, getFundRedeemList, getFundInfoByCustomerNo } from '@/api/fund'
import { ElInput, ElDatePicker } from 'element-plus'
import { useStore } from 'vuex'
import { onMounted, ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
const store = useStore()
// ????????????
const customerInfo = computed(() => store.state._user.customerInfo)
// ????????????
const isLoading = ref(false)
// ????????????
const companyList = ref([])
// ????????????
const assetsList = ref([])
// ???????????????
const timeRange = ref(null)
// ????????????????????????????????????
const selfFeesDialogShow = ref(false)
const selfFeesDialogData = ref({})
const selfFeesDialogType = ref('fee') // fee ?????????   amount ??????????????????
const selfFeesDialogTitle = ref('') // ????????????
const selfFeesDialogTHList = ref([]) // ?????????table????????????

// ????????????
const searchParams = reactive({
    // ????????????
    sharesStatus: 1,
    // ?????????
    proposalNoList: '',
    // ????????????
    customerCompanyId: null,
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
const minWidth = ref(120)
// ??????????????????
const total = ref(100)

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
// ????????????
const selectTime = () => {
    const value = timeRange.value
    if (value) {
        searchParams.startTime = window.dayjs(value[0]).valueOf()
        searchParams.endTime = window.dayjs(value[1]).valueOf()
    } else {
        searchParams.startTime = ''
        searchParams.endTime = ''
    }
}
// ??????????????????
const changePage = (value) => {
    searchParams.current = value
    queryFundRedeemList()
}
// ??????????????????
const changeSize = (value) => {
    searchParams.size = value
    searchParams.current = 1
    queryFundRedeemList()
}
// ????????????
const onSearch = () => {
    searchParams.current = 1
    queryFundRedeemList()
}
// ???????????????????????????????????????
const showSelfFeesDialog = (item, type = 'fee') => {
    selfFeesDialogData.value = item
    selfFeesDialogType.value = type
    selfFeesDialogShow.value = true
    selfFeesDialogTitle.value = t('fundManager.buy.redeemDetail')
    if (type === 'fee') {
        selfFeesDialogTHList.value = [t('fundInfo.assets'), t('fundManager.ransom.moneyTotal'), t('fundManager.ransom.fees')]
    } else {
        selfFeesDialogTHList.value = [t('fundInfo.assets'), t('fundManager.ransom.moneyTotal'), t('fundManager.ransom.fees')]
    }
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
