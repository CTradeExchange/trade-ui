<template>
    <div class='header-case'>
        <div class='filter'>
            <div class='item-date'>
                <el-date-picker
                    v-model='listQuery.deductDate'
                    :placeholder="$t('fundManager.deduction.date')"
                    type='date'
                    value-format='YYYY-MM-DD'
                />
            </div>
            <button class='btn' @click='onSearch'>
                {{ $t('compLang.search') }}
            </button>
        </div>
    </div>
    <div v-loading='isLoading' class='body-case'>
        <el-table
            v-if='tableData.length > 0'
            ref='tableRef'
            :cell-style="{ background:'none' }"
            :data='tableData'
            :empty-text="$t('c.noData')"
            @selection-change='selectionChange'
        >
            <el-table-column type='selection' width='50' />
            <el-table-column :label="$t('fundManager.deduction.column1')" :min-width='156' prop='deductDate'>
                <template #default='scope'>
                    <span>{{ formatTime(scope.row.deductDate) }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.deduction.column2')" :min-width='140' prop='fees'>
                <template #default='scope'>
                    <span>{{ scope.row.fees + ' ' + scope.row.currencyFees }} </span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('fundManager.deduction.column3')" :min-width='minWidth' prop='deductStatus'>
                <template #default='scope'>
                    <span>{{ scope.row.deductStatus === '1' ? $t('fundManager.deduction.deductSuceess'): $t('fundManager.deduction.deductFail') }} </span>
                </template>
            </el-table-column>
            <template #empty>
                <span class='emptyText'>
                    {{ $t('c.noData') }}
                </span>
            </template>
        </el-table>
        <van-empty
            v-if='tableData.length === 0'
            :description="$t('api.listnone')"
            image='/images/empty.png'
        />
        <div v-if='tableData.length > 0' class='handle-action'>
            <div class='left'>
                <button :class="['btn', { 'disable': disableBtn }]" @click='openLotDialog("confirm")'>
                    {{ $t('fundManager.deduction.deductBtn') }}
                </button>

                <span>{{ $t('fundManager.deduction.deductPopTxt1') }}: {{ totalLot }} {{ totalLotCell }} ?????????{{ usable }} USDT</span>
            </div>
            <el-pagination
                v-model:currentPage='listQuery.current'
                layout='prev, pager, next, sizes'
                :page-size='listQuery.size'
                :page-sizes='[10, 20, 50, 100]'
                :total='total'
                @current-change='changePage'
                @size-change='changeSize'
            />
        </div>
    </div>

    <!-- ?????????????????? -->
    <div class='dialog-layer'>
        <el-dialog
            v-model='showPop'
            :close-on-click-modal='false'
            :modal-append-to-body='true'
            :title="$t('fundManager.deduction.deductPopTitle')"
            width='520px'
        >
            <p class='p'>
                {{ $t('fundManager.deduction.deductPopTxt1') }} :
                {{ totalLot }} {{ totalLotCell }}
            </p>

            <template #footer v-if='!isLoading'>
                <button v-loading='isSubmit' class='confirm-btn' @click='onConfirm'>
                    {{ $t('confirm') }}
                </button>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { computed, toRefs, reactive, onMounted, ref, inject } from 'vue'
import { getManagementFeesList, getManagementFeesDeduct, getManagementFeesCalc } from '@/api/fund'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { plus, gt } from '@/utils/calculation'
import { Toast } from 'vant'

export default {
    components: {
    },

    setup () {
        const store = useStore()
        const { t } = useI18n({ useScope: 'global' })
        // ??????????????????
        const customInfo = computed(() => store.state._user.customerInfo)
        const companyId = computed(() => customInfo.value.companyId)
        // ??????
        const usable = computed(() => {
            if (companyId) {
                const accountList = customInfo.value !== null ? customInfo.value.accountList.filter(el => el.currency === 'USDT') : null
                return accountList[0].available
            }
            return 0
        })

        const state = reactive({
            listQuery: {
                customerNo: customInfo.value.customerNo,
                companyId: customInfo.value.companyId,
                deductDate: '',
                deductStatus: 2,
                current: 1,
                size: 10
            },
            isSubmit: false,
            calcData: {},
            showPop: false,
            isLoading: false,
            tableRef: null,
            tableData: [],
            assetsList: [],
            minWidth: 130,
            total: 0,
            selectList: [],
            disableBtn: true,
            totalLot: 0,
            totalLotCell: 'USDT',
            lotDialogType: 'preview',
            availableNum: 0
        })

        const deductHot = inject('deductHot')

        // ??????????????????
        const queryFundRedeemList = () => {
            const params = Object.assign({}, state.listQuery)
            state.isLoading = true
            params.deductDate = params.deductDate ? window.dayjs(params.deductDate).valueOf() : null
            // console.log(params)
            getManagementFeesList(params).then(res => {
                state.isLoading = false
                // console.log(res)
                if (res.check()) {
                    const { data } = res
                    state.tableData = data.records
                    state.total = data.total
                    if (data.records.length > 0) {
                        deductHot(true)
                    } else {
                        deductHot(false)
                    }
                } else {
                    state.tableData = []
                    state.total = 0
                    deductHot(false)
                }
            }).catch(() => {
                state.isLoading = false
            })
        }

        // ?????????????????????
        const handleDeductFees = () => {
            const params = Object.assign({}, {
                customerNo: state.listQuery.customerNo,
                companyId: state.listQuery.companyId,
                idList: state.assetsList
            })
            // state.isLoading = true
            // console.log(params)
            // Toast('res.msg')
            getManagementFeesDeduct(params).then(res => {
                state.isLoading = false
                // console.log(res)
                if (res.check()) {
                    Toast(t('fundManager.deduction.tip2'))
                    state.showPop = false
                    queryFundRedeemList()
                    state.selectList = []
                    state.tableRef.clearSelection()
                    state.searchParams.current = 1
                } else {
                    Toast(res.msg)
                }
            }).catch(() => {
                state.isLoading = false
            })
        }

        // ??????????????????????????????
        const getFeesCalc = () => {
            const params = Object.assign({}, {
                customerNo: state.listQuery.customerNo,
                companyId: state.listQuery.companyId,
                idList: state.assetsList
            })
            getManagementFeesCalc(params).then(res => {
                if (res.check()) {
                    // console.log(res)
                    state.showPop = true
                    state.totalLot = res.data.amount
                    state.totalLotCell = res.data.currency
                }
            })
        }

        // ??????????????????
        const changePage = (value) => {
            state.listQuery.current = value
            queryFundRedeemList()
        }
        // ??????????????????
        const changeSize = (value) => {
            state.listQuery.current = 1
            state.listQuery.size = value
            queryFundRedeemList()
        }
        // ????????????
        const onSearch = () => {
            state.listQuery.current = 1
            queryFundRedeemList()
        }
        // ????????????
        const selectionChange = (list) => {
            state.selectList = list
            state.disableBtn = state.selectList.length === 0
            let totalNum = 0
            list.map(item => {
                totalNum = plus(totalNum, item.fees)
            })
            state.totalLot = totalNum
        }

        // ??????????????????
        const openLotDialog = (type) => {
            if (state.disableBtn) return
            if (gt(state.totalLot, usable)) {
                return Toast(t('fundManager.deduction.tip1'))
            }
            const ids = state.selectList.map(elem => elem.id)
            state.assetsList = ids
            getFeesCalc()
            // state.showPop = true
        }
        // ????????????
        const onConfirm = () => {
            handleDeductFees()
        }

        const formatTime = (val) => {
            return window.dayjs(val).format('YYYY-MM-DD')
        }

        onMounted(() => {
            // ????????????????????????
            queryFundRedeemList()
        })

        return {
            customInfo,
            usable,
            formatTime,
            handleDeductFees,
            getFeesCalc,
            queryFundRedeemList,
            changePage,
            changeSize,
            onSearch,
            selectionChange,
            deductHot,
            openLotDialog,
            onConfirm,
            ...toRefs(state)
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../index.scss';
.dialog-layer {
    :deep(.el-dialog) {
        height: 240px;
    }
    .confirm-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 320px;
        height: 48px;
        margin: 0 auto;
        color: #FFF;
        font-size: 16px;
        background: var(--primary);
        border-radius: 24px;
        cursor: pointer;
        &:hover {
            opacity: 0.9;
        }
    }
    .p {
        padding: 5px 0;
        font-size: 16px;
        text-align: center;
    }
}
</style>
