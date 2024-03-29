import CreateSocket from './createSocket'
import QuoteSocketEvent from './quoteSocketEvent'
import MsgSocketEvent from './msgSocketEvent'
import { ungzip } from './socketUtil'
import { getToken, getQueryString } from '@/utils/util.js'

let _store = null
let _router = null

export const QuoteSocket = new QuoteSocketEvent() // 行情websocket
export const MsgSocket = new MsgSocketEvent() // 消息websocket

if (process.env.NODE_ENV === 'development') {
    window.QuoteSocket = QuoteSocket
    window.MsgSocket = MsgSocket
}

/** 获取 - 行情服务websocket地址
 * 游客用户使用 /quote_guest
 * 登录用户使用 /quote
 */
export const getQuoteService = () => {
    const token = getToken()
    let quoteService = window['quoteService'] || ''
    if (0 && token) {
        quoteService += '?token=' + token
    } else {
        quoteService = quoteService.replace('/quote', '/quote_guest')
    }
    return quoteService
}

/** 设置 - 行情服务websocket地址 */
export const setQuoteService = () => {
    return false
    const quoteService = getQuoteService()
    const quoteWS = CreateSocket(quoteService)
    // QuoteSocket.ws.url = quoteService
    QuoteSocket.ws.close()
    QuoteSocket.init(quoteWS)
    quoteWS.open()
    quoteWSEvent(quoteWS) // 行情事件处理
    // setTimeout(() => {
    // QuoteSocket.ws.open()
    // }, 300)
}

// 行情websocket事件处理
function quoteWSEvent (quoteWS) {
    quoteWS.addEventListener('message', evt => {
        if (typeof evt.data === 'string' && evt.data.startsWith('p(')) {
            return QuoteSocket.tick(evt.data)
        } else if (typeof evt.data === 'string' && evt.data.startsWith('pr(')) {
            return QuoteSocket.tick24H(evt.data)
        } else if (typeof evt.data === 'string' && evt.data.startsWith('pt(')) {
            const event = new CustomEvent('GotMsg_updateChart', { detail: evt.data })
            document.body.dispatchEvent(event)
            return QuoteSocket.deal_tick(evt.data)
        } else if (typeof evt.data === 'string' && evt.data.startsWith('pd(')) {
            return QuoteSocket.handicap_tick(evt.data)
        } else if (typeof evt.data === 'string' && evt.data.indexOf('{') !== 0) return

        try {
            if (typeof evt.data === 'object') {
                ungzip(evt.data).then(res => {
                    QuoteSocket.onMessage(res)
                })
            } else {
                const data = JSON.parse(evt.data)
                QuoteSocket.onMessage(data)
            }
        } catch (error) {

        }
    })

    quoteWS.addEventListener('open', function () {
        QuoteSocket.initPing() // 心跳
        QuoteSocket.onOpen() // 连接成功
    })
    quoteWS.addEventListener('close', function (err) {
        console.warn('quoteWS close', err)
    })
}

// 消息websocket事件处理
function msgWSEvent (msgWS) {
    msgWS.addEventListener('open', function () {
        MsgSocket.initPing() // 心跳
        MsgSocket.onOpen() // 连接成功
    })

    msgWS.addEventListener('close', function (err) {
        console.warn('msgWS close', err)
        MsgSocket.onDisconnect() // 断开链接
    })

    msgWS.addEventListener('message', evt => {
        if (typeof evt.data === 'string' && evt.data.startsWith('f(')) return MsgSocket.positionsTick(evt.data, 1)
        else if (typeof evt.data === 'string' && evt.data.startsWith('g(')) return MsgSocket.positionsTick(evt.data, 2)
        if (typeof evt.data === 'object' || evt.data.indexOf('{') !== 0) return
        try {
            const data = JSON.parse(evt.data)
            MsgSocket.onMessage(data)
        } catch (error) {}
    })
}

export default {
    install: (app, { $store, $router } = {}) => {
        _store = $store
        _router = $router
        connectWebsocket()

        app.config.globalProperties.$QuoteSocket = QuoteSocket
        app.config.globalProperties.$MsgSocket = MsgSocket
    }
}

// 连接消息和行情websocket
export const connectWebsocket = () => {
    // 连接行情websocket
    connectQuoteWS()

    // 连接消息websocket
    connectMsgWS()
}

// 连接行情websocket
export const connectQuoteWS = () => {
    const quoteService = getQuoteService()
    const quoteWS = CreateSocket(quoteService)
    QuoteSocket.init(quoteWS, _store, _router)
    quoteWS.open()
    quoteWSEvent(quoteWS) // 行情事件处理
}

// 连接消息websocket
// 默认开启消息推送，uniapp环境下不开
export const connectMsgWS = () => {
    if (!getQueryString('isUniapp')) {
        const msgService = window['msgService']
        const msgWS = CreateSocket(msgService)
        MsgSocket.init(msgWS, _store, _router)
        msgWS.open()
        msgWSEvent(msgWS) // 消息事件处理
    }
}
