### 安装
```bash
npm i
```
### 启动服务
```bash
node main.js
```
### 启动前端
```bash
npm run build // 打包
npm run start // 本地
```
### 推送流程
1 获取用户授权
```js
Notification.requestPermission
```
2 订阅推送服务
> 1 注册Service Worker

> 2 使用 pushManager 添加订阅，得到订阅对象，并发送到服务器保存下来

3 服务器推送消息
服务端请求推送服务，需要涉及加密，设置请求头等复杂操作，使用web-push可以帮助我们解决大部分问题。
> 1 使用 web-push 生成一对公私钥，前面使用 pushManager 订阅时用到的applicationServerKey 传递的参数就是公钥。

> 2 调用setVapidDetails为 web-push 设置生成的公私钥

> 3 之前订阅时浏览器已经将推送订阅对象发送到了服务端，此时从数据库中取出。

> 4 调用sendNotification向推送服务发起调用请求，如果返回错误状态码，从数据库中删除保存的推送订阅对象。
```js
var webpush = require('web-push');
var vapidKeys = webpush.generateVAPIDKeys(); // 1.生成公私钥
webpush.setVapidDetails( // 2.设置公私钥
    'mailto:sender@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);
// 3.从数据库中拿出之前保存的pushSubscription，具体实现省略
// 4.向推送服务发起调用请求
webpush.sendNotification(pushSubscription, '推送消息内容')
    .catch(function (err) {
        if (err.statusCode === 410) {
            // 从数据库中删除推送订阅对象
         }
    });
```
#### 消息推送的安全性
  * 推送服务确保调用来自可靠的服务端
   
    服务器在调用推送服务时，需要额外发送请求头，例如 Authorization 和 Crypto-Key，首先介绍 Authorization。
    Authorization 就包含了 JWT 格式的字符串： Authorization: 'WebPush <JWT Info>.<JWT Data>.<Signature>'

    Authorization的内容由三部分组成，使用.连接，前两部分是使用base64编码后的JSON字符串，内容是签名使用的加密算法和发送者的信息。

    签名，使用服务端生成的私钥加密<JWT Info>.<JWT Data>这部分内容 

    请求头中还需要将公钥带给推送服务： Crypto-Key: p256ecdsa=<URL Safe Base64 Public Application Server Key>

    当推送服务收到服务端的调用请求时，使用公钥解密 Authorization 签名部分（Signature），如果匹配前两部分，说明请求来自可靠的服务端。
  * 推送消息内容只有浏览器能解密

4 通过service Worker 监听push事件, 来显示通知
```js
self.addEventListener('push', function (e) {
  if(e.data) {
    let data = JSON.parse(e.data.text());
    let option = typeof data == 'object' ? data : { body: data }
    e.waitUntil(
      self.registration.showNotification('消息提醒', option)
    );
  }
});
```
### 参考资料
* [深入理解 PWA](https://juejin.im/post/5c07493951882516cd70d213#heading-21)
* [The Web Push Protocol](https://developers.google.cn/web/fundamentals/push-notifications/web-push-protocol)
* [向网络应用添加推送通知](https://developers.google.com/web/fundamentals/codelabs/push-notifications/?hl=zh-CN#%E5%8F%96%E6%B6%88%E8%AE%A2%E9%98%85%E7%94%A8%E6%88%B7)
* [消息推送介绍](https://lavas.baidu.com/pwa/engage-retain-users/how-push-works)
* [web-push实现原理及细节介绍](https://segmentfault.com/a/1190000013061924)
