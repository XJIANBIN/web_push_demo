// server.js
const webpush = require('web-push');
const express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


const app = express();
const userInfo = {}  // 保存用户订阅对象，以发送推送
// Express setup
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cookieParser());

function saveRegistrationDetails(id, endpoint, key, authSecret) {
  // 保存在内存中 或者 写入数据库
  userInfo[id] = {
    endpoint: endpoint,
    key: key,
    authSecret: authSecret,
  }
}

// 使用web-push api 来提供公私钥
// const vapidKeys = webpush.generateVAPIDKeys();
// vapidKeys.publicKey,
// vapidKeys.privateKey

webpush.setVapidDetails(
  'mailto:contact@deanhume.com',
  'BIYchHRMXBRS72DgKDbDyowSD_oUM90LNyXUF31aiwkt2dcTKF0fWNc2MQrsSQQjOuJ0jc_2gMX5rII4oL5lkF8',
  '3P-6vlL4WMa6CQy4afvZ5JfJM-uek3NHwPlhKHo2-Gg'
);
//设置允许跨域访问该服务.
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Content-Type', 'application/json;charset=utf-8');
  next();
});

// 推送内容
let options = {
  body: '想知道啊？点进来看一看呗',
  icon: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1573709353228&di=368f244eb7a027b57551bcf938118173&imgtype=0&src=http%3A%2F%2F5b0988e595225.cdn.sohucs.com%2Fq_70%2Cc_zoom%2Cw_640%2Fimages%2F20181222%2Fd90ab703004e4e48ba548d60f9324fb4.jpeg',
  vibrate: [100, 50, 100],
  data: {
    dateOfArrival: Date.now(),
    primaryKey: '2'
  },
  actions: [
    {
      action: 'explore', title: '来了来了老弟！',
      icon: 'https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=1569529552,2574429190&fm=11&gp=0.jpg'
    },
    {
      action: 'close', title: '哼，我才不上你的当！',
      icon: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1573709284864&di=a76744964eb98e22b8e8ee89e66a65a0&imgtype=0&src=http%3A%2F%2Fimg02.sogoucdn.com%2Fapp%2Fa%2F200678%2Fa543f953fbf00ac912b473d9f677bb2a.jpg'
    },
  ]
};
// 模拟自动推送
// setInterval(() => {
//   console.log('setTimeout')
//   for (const key in userInfo) {
//     console.log('for' + key)
//     const element = userInfo[key];
//     let pushSubscription = {
//       endpoint: element.endpoint,
//       keys: {
//         auth: element.authSecret,
//         p256dh: element.key
//       }
//     }
//     webpush.sendNotification(pushSubscription,
//       JSON.stringify(options))
//       .then(result => {
//       })
//       .catch(err => {
//         console.log(err);
//       });
//   }
// }, 5000);

// Send a message
app.post('/sendMessage', function (req, res) {

  var endpoint = req.body.endpoint;
  var authSecret = req.body.authSecret;
  var key = req.body.key;

  // 保存推送信息
  saveRegistrationDetails(req.cookies.userId, endpoint, key, authSecret);

  const pushSubscription = {
    endpoint: req.body.endpoint,
    keys: {
      auth: authSecret,
      p256dh: key
    }
  };

  webpush.sendNotification(pushSubscription,
    JSON.stringify(options))
    .then(result => {
      res.sendStatus(201);
    })
    .catch(err => {
      console.log(err);
    });
});

// Register the user
app.post('/register', function (req, res) {

  var endpoint = req.body.endpoint;
  var authSecret = req.body.authSecret;
  var key = req.body.key;
  // Store the users registration details
  saveRegistrationDetails(req.cookies.userId, endpoint, key, authSecret);

  const pushSubscription = {
    endpoint: req.body.endpoint,
    keys: {
      auth: authSecret,
      p256dh: key
    }
  };
  webpush.sendNotification(pushSubscription,
    JSON.stringify(options))
    .then(result => {
      res.sendStatus(201);
    })
    .catch(err => {
      console.log(err);
    });

});

// 起服务
app.listen(3111, function () {
  console.log('Now your app listening on port 3111')
});