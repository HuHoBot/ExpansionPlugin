//LiteLoaderScript Dev Helper
/// <reference path="E:\\MCServer\\HelperLib\\src\\index.d.ts"/> 

const HUHONAMESPACE = 'HuHo_Bot'
const NAMESPACE = 'AddWhiteList'

function Callback(dataStr){
    /*{
            "key":keyWord,
            "runParams":paramsList,
            "author":{
                "qlogoUrl":getQLogoUrl(message.author.member_openid),
                "bindNick":nick,
                "openId":message.author.member_openid,
            },
            "group":{
                "openId":message.group_openid,
            }
        } */
    let data = JSON.parse(dataStr)
    let params = data.runParams
    let qlogoUrl = data.author.qlogoUrl

    if(params.length < 1){
        return `请输入要添加的白名单 XboxId`
    }

    let xboxId = params[0]
    let outputAdd = mc.runcmdEx(`allowlist add "${xboxId}"`)
    if (outputAdd.success) {
        //return `已接受添加名为${xboxId}的白名单请求`
        return JSON.stringify({"text": `已接受添加名为${xboxId}的白名单请求`,"imgUrl":qlogoUrl})
    } else {
        return `已拒绝添加名为${xboxId}的白名单请求\n返回如下:${outputAdd.output}`;
    }
}

/**
 * 注册回调函数
 * @param {string} keyWord 
 * @param {function} func 
 */
function regCallbackEvent(type,keyWord,func){
    if(!ll.hasExported(HUHONAMESPACE,'regEvent')){
        return;
    }
    let regEvent = ll.imports(HUHONAMESPACE,'regEvent')
    ll.exports(func,NAMESPACE,func.name)
    regEvent(type,keyWord,NAMESPACE,func.name)
}

mc.listen("onServerStarted",()=>{
    regCallbackEvent("run","加白名",Callback)
})