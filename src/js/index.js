// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('sw.js').then(function (reg) {
//     console.log('Service Worker Registered!', reg);

//     reg.pushManager.getSubscription().then(function (sub) {
//       if (sub === null) {
//         // Update UI to ask user to register for Push
//         console.log('Not subscribed to push service!');
//       } else {
//         // We have a subscription, update the database
//         console.log('Subscription object: ', sub);
//       }
//     });
//   })
//     .catch(function (err) {
//       console.log('Service Worker registration failed: ', err);
//     });
// }

// function subscribeUser() {
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.ready.then(function (reg) {

//       reg.pushManager.subscribe({
//         userVisibleOnly: true
//       }).then(function (sub) {
//         console.log('Endpoint URL: ', sub.endpoint);
//       }).catch(function (e) {
//         if (Notification.permission === 'denied') {
//           console.warn('Permission for notifications was denied');
//         } else {
//           console.error('Unable to subscribe to push', e);
//         }
//       });
//     })
//   }
// }

// 跟用户请求推送权限
Notification.requestPermission(function (status) {
  console.log('Notification permission status:', status);
  //status 会有三个取值default granted denied 分别代表： 默认值（每次访问页面都询问）、 允许、拒绝
});

document.getElementById('sendMessage').addEventListener('click', function () {
  $.ajax({
    url: '/api/sendMessage',
    type: 'POST',
    data: JSON.parse(localStorage.getItem('subscription')),
    success: function () {
      console.log('send success!')
    },
    error: function () {
      console.log('send fail!')
    }
  })
})

function setCookie() {
  if (!document.cookie.userId) {
    document.cookie.userId = "userId=" + Math.round(Math.random() * 10000000000);
  }
}
setCookie()

var endpoint;
var key;
var authSecret;

// We need to convert the VAPID key to a base64 string when we subscribe
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function determineAppServerKey() {
  var vapidPublicKey = 'BIYchHRMXBRS72DgKDbDyowSD_oUM90LNyXUF31aiwkt2dcTKF0fWNc2MQrsSQQjOuJ0jc_2gMX5rII4oL5lkF8';
  return urlBase64ToUint8Array(vapidPublicKey);
}
// 2 订阅
function subscribe(registration) {
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: determineAppServerKey()
  })
    .then(function (subscription) {
      sendEndpointInSubscription(subscription);
    });
}
// 3 发送推送订阅对象到服务器，具体实现中发送请求到后端api
function sendEndpointInSubscription(subscription) {
  var rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
  key = rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : '';
  var rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
  authSecret = rawAuthSecret ?
    btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : '';

  endpoint = subscription.endpoint;
  localStorage.setItem('subscription', JSON.stringify({
    endpoint: subscription.endpoint,
    key: key,
    authSecret: authSecret,
  }))
  return fetch('/api/register', {
    method: 'post',
    credentials: 'include',
    headers: new Headers({
      'content-type': 'application/json'
    }),
    body: JSON.stringify({
      id: document.cookie.userId,
      endpoint: subscription.endpoint,
      key: key,
      authSecret: authSecret,
    }),
  })
}
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('../js/sw.js').then(function (registration) {
      return registration.pushManager.getSubscription()
        .then(function (subscription) {
          if (subscription) {
            // We already have a subscription, let's not add them again
            return;
          }
          subscribe(registration)
        });
    }).catch(function (err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  })

}


