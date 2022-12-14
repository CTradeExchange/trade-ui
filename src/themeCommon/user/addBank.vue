<template>
    <div class='page-wrap'>
        <top left-icon='arrow-left' :menu='false' :right-action='false' :show-center='true' />
        <div class='filed-wrap'>
            <van-cell-group>
                <van-field
                    v-model.trim='countryName'
                    :label="$t('bank.bankCountry')"
                    readonly
                    required
                    right-icon='arrow-down'
                    @click='countryShow = true'
                />
                <van-field v-model.trim='firstName' :label='$t("bank.bankPersonFirstName")' :placeholder='$t("bank.bankPersonFirstName")' required />
                <van-field v-model.trim='lastName' :label='$t("bank.bankPersonLastName")' :placeholder='$t("bank.bankPersonLastName")' required />
                <!-- <van-field v-model.trim='bankNo' :label='$t("bank.bankNo")' :placeholder='$t("bank.inputBankNo")' type='number' /> -->
                <van-field v-model.trim='bankAccount' :label='$t("bank.bankAccount")' :placeholder='$t("bank.inputBankAccount")' required />
                <van-field
                    v-model.trim='bankName'
                    :label='$t("bank.bankName")'
                    :placeholder='$t("bank.inputBankName")'
                    readonly
                    required
                    right-icon='arrow-down'
                    @click='openBankDialog'
                />
                <CurrencyAction v-model='currency' v-model:show='currencyShow' class='cellRow' input-align='left' />

                <!-- <van-field
                    v-model.trim='area'
                    :label='$t("bank.openAddress")'
                    :placeholder='$t("bank.inputOpenAddressText")'
                    readonly
                    right-icon='arrow-down'
                    @click='areaShow = true'
                />
                <van-field v-model.trim='bankArea' :label='$t("bank.branchAddress")' :placeholder='$t("bank.inputBranchAddress")' /> -->
                <van-field v-model.trim='swiftCode' label='Swift Code' :placeholder='$t("bank.swiftCode")' />
                <van-field v-model.trim='otherCode' label='Other Code' :placeholder='$t("bank.otherCode")' />
            </van-cell-group>
        </div>
        <van-button block class='confirm-btn mobile_withdraw_choose_bankcard_ga' type='primary' @click='handleConfirm'>
            <span>{{ $t('common.sure') }}</span>
        </van-button>
    </div>

    <!-- ???????????? -->
    <van-popup v-model:show='areaShow' position='bottom'>
        <van-picker
            ref='picker'
            :columns='provinceCities'
            @cancel='areaShow=false'
            @change='onChangeArea'
            @confirm='areaConfirm'
        />
    </van-popup>
    <!-- ?????????????????? -->
    <van-action-sheet
        v-model:show='countryShow'
        :actions='countryList'
        :round='false'
        @select='countryConfirm'
    />
    <!-- ????????????????????? -->
    <van-popup
        v-model:show='bankShow'
        class='popup-bank'
        position='right'
        :style="{ height: '100%' }"
    >
        <div v-if='(bankList.length > 0)' class='bank-list'>
            <div v-for='item in bankList' :key='item.code' class='bank-item' @click='onSelectBank(item)'>
                <van-icon class='card' name='card' />
                <span>{{ item.name }}</span>
            </div>
        </div>
        <van-empty v-else :description='$t("bank.bankCountryTip")' image='/images/empty.png' />
    </van-popup>
    <!-- ?????????????????? -->
    <van-dialog
        v-model:show='addSuccessShow'
        :cancel-button-text='$t("common.cancel")'
        class-name='add-success'
        :confirm-button-text='$t("common.sure")'
        :show-cancel-button='showCancel'
        @cancel='cancel'
        @confirm='$router.back()'
    >
        <i class='icon_success'></i>
        <p class='title'>
            {{ $t('common.tip') }}
        </p>
        <p class='content'>
            {{ $t('bank.submitSuccessTips') }}
        </p>
    </van-dialog>
</template>

<script>
import { useRouter } from 'vue-router'
import top from '@/components/top'
import { reactive, toRefs, computed, ref, watch, watchEffect, onMounted } from 'vue'
import RuleFn from './addbank_rule'
import { useStore } from 'vuex'
import Schema from 'async-validator'
import { Toast } from 'vant'
import { addInternationalBank } from '@/api/user'
import { getCountryListByParentCode, getListByParentId } from '@/api/base'
import CurrencyAction from '@/components/currencyAction'
import { useI18n } from 'vue-i18n'

export default {
    components: {
        top,
        CurrencyAction
    },
    async setup (props, { emit, attrs }) {
        const router = useRouter()
        const store = useStore()
        const picker = ref(null)
        const { t } = useI18n({ useScope: 'global' })
        // ????????????
        const customInfo = computed(() => store.state._user.customerInfo)
        // ????????????
        const countryList = computed(() => {
            return store.state.countryList
        })
        // ???????????????????????????
        const countryName = computed(() => {
            const item = countryList.value.find(el => el.code === state.countryCode)
            return item?.displayName || ''
        })
        // ???????????????????????????
        const countryBanks = computed(() => store.state.bankDict)

        const state = reactive({
            countryCode: customInfo.value.country, // ?????????????????????code
            countryShow: false, // ??????????????????????????????
            bankList: [], // ???????????????????????????????????????
            firstName: '',
            lastName: '',
            bankNo: '',
            bankName: '',
            currency: '',
            area: '',
            bankArea: '',
            areaShow: false,
            bankShow: false,
            checkedBankCode: '',
            currencyShow: false,
            addSuccessShow: false,
            showCancel: false,
            provinceCities: [],
            bankAccount: '',
            swiftCode: '',
            otherCode: ''
        })

        // ???????????????????????????
        const getBankList = () => {
            const item = countryBanks.value.find(el => el.code === (state.countryCode + '_bank'))
            if (item) {
                getListByParentId({
                    parentId: item.id
                }).then(res => {
                    state.bankName = ''
                    state.checkedBankCode = ''
                    if (res.check()) {
                        state.bankList = res.data || []
                    } else {
                        state.bankList = []
                    }
                })
            } else {
                state.bankName = ''
                state.checkedBankCode = ''
                state.bankList = []
            }
        }

        // ???????????????????????????
        const getProvinceCities = async (parentCode) => {
            state.loading = true
            await getCountryListByParentCode({ parentCode }).then(res => {
                if (res.check()) {
                    if (res.data.length > 0) {
                        if (state.provinceCities.length > 0) {
                            state.provinceCities.forEach(pc => {
                                res.data.forEach(el => {
                                    if (pc.code === el.parentCode) {
                                        pc.children = res.data.map(el => { return { text: el.displayName } })
                                    }
                                })
                            })
                        } else {
                            res.data.forEach(el => {
                                state.provinceCities.push({
                                    text: el.displayName,
                                    code: el.code,
                                    children: []
                                })
                            })
                        }
                    }
                }
            })
        }

        // await getProvinceCities(customInfo.value.country)
        if (state.provinceCities.length > 0) {
            getProvinceCities(state.provinceCities[0]?.code)
        }

        const onSelectBank = (item) => {
            state.bankShow = false
            state.bankName = item.name
            state.checkedBankCode = item.code
        }

        const onSelectCurrency = (item) => {
            state.currencyShow = false
            state.currency = item.name
        }

        const onChangeArea = async (values) => {
            await getProvinceCities(values[0].code)
            const citys = state.provinceCities.find(el => el.code === values[0].code).children
            picker.value.setColumnValues(1, citys)
            // picker.value.setColumnValues(1, provinceCities[values[0]])
        }

        // ????????????
        const handleConfirm = () => {
            // firstName??????????????????
            // lastName??????????????????
            // bankAccountName?????????????????????
            // bankCardNumber????????????
            // bankCurrency????????????
            // bankName????????????
            // bankAddress??????????????????
            // bankBranch????????????
            // country??????
            // province???
            // city???
            const province = state.area.split(',')[0]
            const city = state.area.split(',')[1]
            const params = {
                firstName: state.firstName,
                lastName: state.lastName,
                bankName: state.bankName,
                bankCurrency: state.currency,
                bankCode: state.checkedBankCode,
                bankAccount: state.bankAccount,
                swiftCode: state.swiftCode,
                otherCode: state.otherCode
            }

            const validator = new Schema(RuleFn(t))

            validator.validate(params, (errors, fields) => {
                if (errors) {
                    return Toast(errors[0].message)
                }
                handleAddBank(params)
            })
        }

        // ??????????????????
        const countryConfirm = (item) => {
            state.countryCode = item.code
            state.countryShow = false
        }

        const handleAddBank = (params) => {
            const toast = Toast.loading({
                message: t('common.loading'),
                forbidClick: true,
            })
            addInternationalBank(params).then(res => {
                toast.clear()
                if (res.check()) {
                    state.addSuccessShow = true
                }
            })
        }

        // ????????????????????????
        const openBankDialog = () => {
            if (state.bankList.length === 0) {
                return Toast(t('bank.bankCountryTip'))
            }
            state.bankShow = true
        }

        const cancel = () => {
            state.firstName = ''
            state.lastName = ''
            state.bankNo = ''
            state.currency = ''
            state.bankName = ''
            state.bankArea = ''
            state.area = ''
        }

        const areaConfirm = (val) => {
            state.areaShow = false
            state.area = val.map(el => el.text).join()
        }

        // ??????countryCode
        watchEffect(() => {
            if (state.countryCode && countryBanks.value.length > 0) {
                // ???????????????????????????
                getBankList()
            }
        })

        onMounted(() => {
            // ??????????????????
            store.dispatch('getCountryListByParentCode')
            // ???????????????????????????
            store.dispatch('getBankDictList')
        })

        return {
            countryName,
            countryList,
            countryConfirm,
            openBankDialog,
            onSelectBank,
            onSelectCurrency,
            ...toRefs(state),
            handleConfirm,
            cancel,
            picker,
            onChangeArea,
            areaConfirm
        }
    }
}
</script>

<style lang="scss" scoped>
@import '@/sass/mixin.scss';
.page-wrap {
    flex: 1;
    background-color: var(--bgColor);
    :deep {
        .van-cell {
            font-size: rem(26px);
        }
        .van-field__label {
            width: rem(200px);
        }
    }
    .confirm-btn {
        height: rem(90px);
        position: absolute;
        bottom: 0;
        background: var(--contentColor);
        border-color: var(--lineColor);
        span {
            color: var(--color);
            font-size: rem(30px);
        }
    }
}

</style>

<style lang="scss">
@import '@/sass/mixin.scss';
.popup-bank {
    width: rem(600px);
    background-color: var(--bgColor);
    .bank-list {
        padding: rem(30px) 0;
        background-color: var(--contentColor);
        .bank-item {
            display: flex;
            align-items: center;
            height: rem(120px);
            position: relative;
            padding: 0 rem(40px);
            color: var(--color);
            font-size: rem(28px);
            text-align: left;
            &::after {
                position: absolute;
                top: 0;
                left: 0;
                -webkit-box-sizing: border-box;
                box-sizing: border-box;
                width: 200%;
                height: 200%;
                border-bottom: 1px solid var(--lineColor);
                -webkit-transform: scale(0.5);
                transform: scale(0.5);
                -webkit-transform-origin: 0 0;
                transform-origin: 0 0;
                content: '';
                pointer-events: none;
            }
            .card {
                margin-top: rem(-12px);
                margin-right: rem(14px);
                color: var(--minorColor);
                font-size: rem(48px);
            }
        }
    }
    .van-empty__description {
        text-align: center;
        padding: 0 rem(60px);
        font-size: rem(26px);
    }
}
.action-sheet-area {
    .van-picker {
        background-color: var(--bgColor);
        .van-picker-column__item {
            color: var(--color);
        }
        .van-picker__toolbar {
            color: var(--color);
        }
        .van-picker__mask {
            background-image: none;
        }
    }
}
.add-success {
    padding: rem(30px) rem(30px) 0 rem(30px);
    text-align: center;
    background-color: var(--contentColor);
    .icon_success {
        color: var(--success);
        font-size: rem(96px);
    }
    .title {
        color: var(--color);
        line-height: rem(80px);
    }
    .content {
        margin: rem(20px) 0;
        color: var(--color);
        font-size: rem(28px);
    }
    .van-dialog__confirm {
        color: var(--color);
        background-color: var(--contentColor);
    }
}
</style>
