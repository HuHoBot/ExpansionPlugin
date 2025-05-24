//LiteLoaderScript Dev Helper
/// <reference path="E:\\MCServer\\HelperLib\\src\\index.d.ts"/> 

const HUHONAMESPACE = 'HuHo_Bot'
const NAMESPACE = 'HuHoWhiteList'
const PLUGINNAME = 'HuHoWhiteList'
const PATH = `plugins/${PLUGINNAME}/`
const CONFIGPATH = `${PATH}config.json`

/**
 * 读取文件
 * @param {string} file 
 * @returns 
 */
function readFile(file) {
    try {
        return JSON.parse(File.readFrom(file))
    } catch (_) {
        logger.error("文件读取出错，请尝试清空数据")
        return {}
    }
}

/**
 * 写入文件
 * @param {string} file 
 * @param {Object} data 
 * @returns 
 */
function writeFile(file, data) {
    return File.writeTo(file, JSON.stringify(data, null, '\t'))
}

class WhitelistDB {
    constructor() {
        this.db = null;
        this.dbPath = `plugins/HuHoWhiteList/whitelist.db`;
    }

    /**
     * 初始化数据库连接
     * @returns {boolean} 是否成功
     */
    init() {
        try {
            // 严格按LSE文档创建DBSession
            this.db = new DBSession("sqlite3", {
                path: this.dbPath,
                create: true,
                readwrite: true
            });

            // 创建表 (使用标准query方法)
            this.db.query(`CREATE TABLE IF NOT EXISTS bindings (
                qq TEXT PRIMARY KEY,
                player_name TEXT NOT NULL UNIQUE
            )`);

            logger.info("数据库初始化完成");
            return true;
        } catch (e) {
            logger.error(`数据库初始化失败: ${e}`);
            return false;
        }
    }

    /**
     * 检查绑定是否存在
     * @param {string} qq 
     * @param {string} playerName 
     * @returns {boolean}
     */
    isBound(qq, playerName) {
        if (!this.checkDB()) return true;

        try {
            const stmt = this.db.prepare(
                "SELECT COUNT(*) AS count FROM bindings WHERE qq = ? OR player_name = ?"
            );
            
            stmt.bind([qq, playerName]);
            const result = stmt.execute().fetchAll();
            return result[1][0] > 0; // 结果格式: [["count"], [具体数值]]
        } catch (e) {
            logger.error(`查询失败: ${e}`);
            return true;
        }
    }

    /**
     * 添加绑定
     * @param {string} qq 
     * @param {string} playerName 
     * @returns {boolean}
     */
    addBinding(qq, playerName) {
        if (!this.checkDB()) return false;

        try {
            const stmt = this.db.prepare(
                "INSERT INTO bindings (qq, player_name) VALUES (?, ?)"
            );
            
            // 使用数组参数绑定
            stmt.bind([qq, playerName]);
            
            stmt.execute();
            return true;
        } catch (e) {
            logger.error(`添加失败: ${e}`);
            return false;
        }
    }

    /**
     * 删除绑定
     * @param {string} identifier 
     * @returns {number} 影响行数
     */
    removeBinding(identifier) {
        if (!this.checkDB()) return -1;

        try {
            const stmt = this.db.prepare(
                "DELETE FROM bindings WHERE qq = ? OR player_name = ?"
            );
            
            // 数组参数绑定
            stmt.bind([identifier, identifier]);
            
            const result = stmt.execute();
            return result.affectedRows;
        } catch (e) {
            logger.error(`删除失败: ${e}`);
            return -1;
        }
    }

    /**
     * 获取绑定信息
     * @param {string} identifier 
     * @returns {Object|null} 
     */
    getBinding(identifier) {
        if (!this.checkDB()) return null;

        try {
            // 作为QQ查询
            let stmt = this.db.prepare(
                "SELECT qq, player_name FROM bindings WHERE qq = ?"
            );
            stmt.bind([identifier]);
            
            let result = stmt.execute().fetchAll();
            if (result != undefined && result.length > 1) { // 有数据
                return {
                    qq: result[1][0],    // 第一行数据
                    playerName: result[1][1]
                };
            }

            // 作为玩家名查询
            stmt = this.db.prepare(
                "SELECT qq, player_name FROM bindings WHERE player_name = ?"
            );
            stmt.bind([identifier]);
            
            result = stmt.execute().fetchAll();
            if (result != undefined && result.length > 1) {
                return {
                    qq: result[1][0],
                    playerName: result[1][1]
                };
            }

            return null;
        } catch (e) {
            logger.error(`查询失败: ${e}`);
            return null;
        }
    }

    // 私有方法
    checkDB() {
        if (!this.db || !this.db.isOpen()) {
            logger.error("数据库未连接");
            return false;
        }
        return true;
    }

    close() {
        if (this.db && this.db.isOpen()) {
            this.db.close();
        }
    }
}

// 使用示例
const db = new WhitelistDB();

function ApplyCallback(dataStr){
    const data = JSON.parse(dataStr);
    const qq = data.author?.bindQQ;
    if(data.runParams.length < 1){
        return "缺少参数"
    }
    const playerName = data.runParams[0];

    if (!qq) {
        return "未查询到您的绑定QQ信息，请使用/认证 <qq>来进行绑定QQ";
    }

    if (db.isBound(qq, playerName)) {
        return "您已经绑定过该账号";
    }

    if (db.addBinding(qq, playerName)) {
        mc.runcmd(`allowlist add "${playerName}"`)
        return `提交绑定成功`;
    } else {
        return "绑定失败";
    }
}

function DeleteCallback(dataStr){
    const data = JSON.parse(dataStr);
    const identifier = data.runParams[0];
    if(data.runParams.length < 1){
        return "缺少参数"
    }
    const binding = db.getBinding(identifier);

    if (!binding) {
        return `未找到${identifier}的有效信息`;
    }

    const deleted = db.removeBinding(identifier);
    if (deleted > 0) {
        mc.runcmd(`allowlist remove "${binding.playerName}"`)
        return `已删除玩家 ${binding.playerName} (QQ: ${binding.qq}) 的白名单`;
    } else {
        return "解除绑定失败";
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
    // 初始化数据库
    if (!db.init()) {
        logger.error("插件启动失败：数据库初始化错误");
        return;
    }
    //获取关键词
    let config = readFile(CONFIGPATH)
    let applyKeyWord = config.keyWord.apply
    let deleteKeyWord = config.keyWord.delete
    regCallbackEvent("run",applyKeyWord,ApplyCallback) //注册申请事件
    regCallbackEvent("runAdmin",applyKeyWord,ApplyCallback)
    regCallbackEvent("runAdmin",deleteKeyWord,DeleteCallback) //注册删除事件
})