import WalletConnectProvider from '@walletconnect/web3-provider'
import { infuraId } from '../config/infuraConfig'
// import Torus from '@toruslabs/torus-embed'
// import Authereum from 'authereum'

// import { Bitski } from 'bitski'

// import Fortmatic from 'fortmatic'
// eslint-disable-next-line global-require
const { USDT_ADDRESS } = process.env.NODE_ENV === 'production' ? require('./constants') : require('./constants.dev')
//
const providerOptions = {
    // https://docs.walletconnect.org/
    walletconnect: {
        package: WalletConnectProvider,
        options: {
            infuraId, // TODO infuraId
            qrcodeModalOptions: {
                desktopLinks: [],
                mobileLinks: [
                    'metamask',
                    // 'imtoken',
                    // 'rainbow',
                    // 'argent',
                    // 'trust',
                    // 'pillar'
                ]
            }
        },
        // bridge: 'https://bridge.walletconnect.org', // Required
        // bridge: 'https://bridge.myhostedserver.com',
    },

    // https://github.com/torusresearch/torus-embed#readme
    // torus: {
    //     package: Torus,
    // },
    // // https://docs.fortmatic.com/
    // fortmatic: {
    //     package: Fortmatic,
    //     options: {
    //         key: 'xxxxxxxxxx', // TODO key
    //     },
    // },
    // // https://docs.authereum.com/integration
    // authereum: {
    //     package: Authereum,
    // },
    // // https://docs.bitski.com/
    // bitski: {
    //     package: Bitski,
    //     options: {
    //         clientId: 'xxxxxxxxxx', // TODO
    //         callbackUrl: `${window.location.href}bitski-callback.html`,
    //     },
    // },
}

export { USDT_ADDRESS, providerOptions }
