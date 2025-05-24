# HuHoWhiteList
HuHoBot 拓展插件，用于群内绑定QQ后可自助申请白名单

##  使用方法
1. 安装插件
    - 下载插件并将`HuHoWhiteList`文件夹放入服务器的`plugins`文件夹内。
2. 使用`/认证 <qq号>`进行绑定QQ
3. 在群内发出`/申请白名单 白名单`来申请白名单（可修改config内的keyWord更改关键词）

## 配置文件
```json
{
  "keyWord": {
    "apply": "申请白名单",
    "delete": "取消白名单"
  }
}
```