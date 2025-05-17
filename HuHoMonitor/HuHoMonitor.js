//LiteLoaderScript Dev Helper
/// <reference path="E:\\MCServer\\HelperLib\\src\\index.d.ts"/> 

const HUHONAMESPACE = 'HuHo_Bot'
const NAMESPACE = 'HuHoMonitor'

// 获取 CPU 使用率（百分比）
const cpuCmd = `wmic cpu get loadpercentage /value | findstr "LoadPercentage"`;
let cpuUsage = "NaN,请稍后查询";
// 获取内存使用率（单位：MB）
const memCmd = `wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value`;
let memUsage = "NaN,请稍后查询";
// 获取所有磁盘使用率（百分比）
const diskCmd = `wmic logicaldisk where drivetype=3 get size,freespace,caption`;
let diskUsage = "NaN,请稍后查询";

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
    const formatString = `🖥 CPU使用率: ${cpuUsage}\n💾 内存使用: ${memUsage}\n💽 磁盘空间: ${diskUsage}`
    
    return formatString;
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

//自动查询服务器信息
function getServerInfo(){ 
    /*
    🖥 CPU使用率: 36.29%
    💾 内存使用: 24.9 GB/31.8 GB
    💽 磁盘空间: C:: 227.7 GB/256.0 GB (88.9%)
                D:: 388.3 GB/675.2 GB (57.5%)
                E:: 847.1 GB/931.3 GB (91.0%)
                F:: 85.1 GB/115.1 GB (74.0%)
    */
    const cpuInfo = system.cmd(cpuCmd,(exitCode,output)=>{
        if(exitCode != 0){
            return;
        }
        cpuUsage = output.split('=')[1].trim() + '%';
    });
    const memInfo = system.cmd(memCmd,(exitCode,output)=>{
        if(exitCode != 0){
            return;
        }
        const [free, total] = output.match(/\d+/g);
        const used = total - free;
        memUsage =  `${(used/1024/1024).toFixed(1)} GB/${(total/1024/1024).toFixed(1)} GB (${(used/total*100).toFixed(1)}%)`;
    });
    const diskInfo = system.cmd(diskCmd,(exitCode,output)=>{
        if(exitCode != 0){
            return;
        }
        diskUsage = output.split('\n')
        .slice(1)
        .map(line => {
            // 使用列分割代替纯数字匹配
            const cols = line.trim().split(/\s+/).filter(Boolean);
            if(cols.length < 3) return '';
            
            const [drive, freeStr, totalStr] = [cols[0], cols[1], cols[2]];
            const free = parseInt(freeStr);
            const total = parseInt(totalStr);
            
            if(isNaN(free) || isNaN(total)) return '';
            
            const used = total - free;
            return `${drive}: ${(used/1024/1024/1024).toFixed(1)} GB/${(total/1024/1024/1024).toFixed(1)} GB (${(used/total*100).toFixed(1)}%)`;
        })
        .filter(Boolean)
        .join('\n            ');
    });
}

mc.listen("onServerStarted",()=>{
    regCallbackEvent("run","服务器状态",Callback)
    regCallbackEvent("runAdmin","服务器状态",Callback)
    getServerInfo() //初始化
    setInterval(getServerInfo,5*1000); //定时五秒查询
})