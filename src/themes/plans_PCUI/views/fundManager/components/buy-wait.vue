<template>
    <div class='header-case'>
        <div class='filter'>
            <div class='item'>
                <el-input v-model='searchParams.proposalNo' clearable :placeholder="$t('fundManager.buy.orderNo')" />
            </div>
            <div class='item'>
                <el-select
                    v-model='searchParams.customerCompanyId'
                    clearable
                    filterable
                    :placeholder="$t('fundManager.buy.woName')"
                >
                    <el-option v-for='item in companyList' :key='item.id' :label='item.name' :value='item.id' />
                </el-select>
            </div>
            <div class='item'>
                <el-input v-model='searchParams.customerSelfNo' clearable :placeholder="$t('fundManager.buy.customerNo')" />
            </div>
            <div class='item'>
                <el-select
                    v-model='searchParams.currencyPay'
                    clearable
                    filterable
                    :placeholder="$t('fundManager.buy.payCurrency')"
                >
                    <el-option v-for='item in assetsList' :key='item.code' :label='item.code' :value='item.code' />
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
        <el-table
            ref='tableRef'
            :cell-style="{ background:'none' }"
            :data='tableData'
            :empty-text="$t('c.noData')"
            @selection-change='selectionChange'
        >
            <el-table-column type='selection' width='50' />
            <el-table-column :label="$t('fundManager.buy.orderNo')" :min-width='140' prop='proposalNo' />
            <el-table-column :label="$t('fundManager.buy.woName')" :min-width='minWidth' prop='companyName' />
            <el-table-column :label="$t('fundManager.buy.customerNo')" :min-width='minWidth' prop='customerNo' />
            <el-table-column :label="$t('fundManager.buy.money')" :min-width='180'>
                <template #default='scope'>
                    <span>{{ scope.row.amountPay }}{{ scope.row.currencyPay }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.buy.payCurrency')" :min-width='minWidth' prop='currencyPay' />
            <el-table-column :label="$t('fundManager.buy.netWorth')" :min-width='150'>
                <template #default='scope'>
                    <span>{{ scope.row.sharesNet }}{{ scope.row.currencyNet }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.buy.fees')" :min-width='150'>
                <template #default='scope'>
                    <span>{{ scope.row.fees }}{{ scope.row.currencyPay }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.buy.finalMoney')" :min-width='150'>
                <template #default='scope'>
                    <span>{{ scope.row.finalAmount }}{{ scope.row.currencyPay }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.buy.lot')" :min-width='minWidth'>
                <template #default='scope'>
                    <span>{{ scope.row.shares }}{{ scope.row.currencyShares }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.buy.status')" :min-width='160'>
                <template #default='scope'>
                    <span>{{ $t('fundManager.confirmStatus.' + scope.row.sharesStatus) }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.buy.applyTime')" :min-width='156' prop='createTime'>
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
            <button :class="['btn', { 'disable': disableBtn }]" @click='openBuyDialog'>
                {{ $t('fundManager.buy.executeOrder') }}
            </button>
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
    <buy-dialog ref='buyDialogRef' @confirm='onConfirm' />
</template>

<script setup>
import buyDialog from './buy-dialog.vue'
import { getCompanyList, getCompanyAssets, getFundApplyList } from '@/api/fund'
import { ElInput, ElDatePicker } from 'element-plus'
import { useStore } from 'vuex'
import { onMounted, ref, reactive, watch, computed } from 'vue'

const store = useStore()
// ????????????
const customerInfo = computed(() => store.state._user.customerInfo)
// ????????????
const isLoading = ref(false)
// ????????????
const companyList = ref([])
// ????????????
const assetsList = ref([])
// ????????????
const tableRef = ref(null)
// ??????????????????
const buyDialogRef = ref(null)
// ???????????????
const timeRange = ref(null)
// ????????????
const searchParams = reactive({
    // ??????
    type: 1,
    // ?????????id
    customerGroupId: customerInfo.value.customerGroupId,
    // ?????????
    proposalNo: '',
    // ????????????
    customerCompanyId: '',
    // ????????????
    customerSelfNo: '',
    // ??????????????????
    currencyPay: '',
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
// ?????????????????????
const selectList = ref([])
// ??????????????????????????????
const disableBtn = ref(true)

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
const queryApplyList = () => {
    const params = Object.assign({}, searchParams)
    params.customerSelfNo = params.customerSelfNo ? params.customerSelfNo.split(',') : []
    params.proposalNo = params.proposalNo ? params.proposalNo.split(',') : []
    params.customerCompanyId = params.customerCompanyId || null
    isLoading.value = true
    getFundApplyList(params).then(res => {
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
        searchParams.startTime = null
        searchParams.endTime = null
    }
}
// ??????????????????
const changePage = (value) => {
    searchParams.current = value
    queryApplyList()
}
// ??????????????????
const changeSize = (value) => {
    searchParams.size = value
    searchParams.current = 1
    queryApplyList()
}
// ????????????
const onSearch = () => {
    searchParams.current = 1
    queryApplyList()
}
// ????????????
const selectionChange = (list) => {
    selectList.value = list
}
// ????????????????????????
const openBuyDialog = () => {
    if (disableBtn.value) return
    const ids = selectList.value.map(elem => elem.id)
    buyDialogRef.value.open(ids)
}
// ??????????????????
const onConfirm = () => {
    selectList.value = []
    tableRef.value.clearSelection()
    searchParams.current = 1
    queryApplyList()
}

onMounted(() => {
    // ??????????????????
    queryCompanyList()
    // ????????????????????????
    queryAssetsList()
    // ????????????????????????
    queryApplyList()
})
</script>

<style lang="scss" scoped>
@import '../index.scss';
</style>
