<template>
    <div class='header-case'>
        <div class='filter'>
            <div class='item'>
                <el-input v-model='searchParams.proposalNo' clearable :placeholder="$t('fundManager.buy.orderNo')" />
            </div>
            <div class='item'>
                <el-input v-model='searchParams.executeId' clearable :placeholder="$t('fundManager.buy.executeNo')" />
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
        <el-table ref='tableRef' :cell-style="{ background:'none' }" :data='tableData' :empty-text="$t('c.noData')">
            <el-table-column :label="$t('fundManager.buy.orderNo')" :min-width='140' prop='proposalNo' />
            <el-table-column :label="$t('fundManager.buy.executeNo')" :min-width='minWidth' prop='executeId'>
                <template #default='scope'>
                    <span>{{ scope.row.executeId || '--' }}</span>
                </template>
            </el-table-column>
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
            <el-table-column :label="$t('fundManager.buy.standard')" :min-width='160' prop='standard'>
                <template #default='scope'>
                    <el-popover
                        :content='formatStandard(scope.row.executeList)'
                        placement='bottom-start'
                        :show-arrow='false'
                        trigger='hover'
                        :width='200'
                    >
                        <template #reference>
                            <span class='standard-btn'>
                                {{ formatStandard(scope.row.executeList) }}
                            </span>
                        </template>
                    </el-popover>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.buy.executeStatus')" :min-width='162'>
                <template #default='scope'>
                    <span>{{ $t('fundManager.executeStatus.' + scope.row.executeStatus) }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.buy.applyTime')" :min-width='156' prop='createTime'>
                <template #default='scope'>
                    <span>{{ formatTime(scope.row.createTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.buy.lastTime')" :min-width='156' prop='updateTime'>
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
                v-model:currentPage='searchParams.page'
                layout='prev, pager, next, sizes'
                :page-size='searchParams.size'
                :page-sizes='[10, 50, 100, 200]'
                :total='total'
                @current-change='changePage'
                @size-change='changeSize'
            />
        </div>
    </div>
</template>

<script setup>
import { getCompanyList, getCompanyAssets, getFundApplyList } from '@/api/fund'
import { ElInput, ElDatePicker } from 'element-plus'
import { useStore } from 'vuex'
import { onMounted, ref, reactive, computed } from 'vue'

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
// ????????????
const searchParams = reactive({
    // ??????
    type: 2,
    // ?????????id
    customerGroupId: customerInfo.value.customerGroupId,
    // ?????????
    proposalNo: '',
    // ????????????id
    executeId: '',
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
    params.proposalNo = params.proposalNo ? params.proposalNo.split(',') : []
    params.customerSelfNo = params.customerSelfNo ? params.customerSelfNo.split(',') : []
    params.executeId = params.executeId ? params.executeId.split(',') : []
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
// ?????????????????????????????????
const formatStandard = (list) => {
    if (!list) return '--'
    let result = ''
    list.map(elem => {
        result += `${elem.symbolName} ${elem.rate}%???`
    })
    return result.substring(0, result.length - 1)
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
.standard-btn {
    @include ellipsis;
    cursor: pointer;
}
</style>
