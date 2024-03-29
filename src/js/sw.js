
self.addEventListener('install', function (event) {
  // 如果监听到了 service worker 已经安装成功的话，就会调用 event.waitUntil 回调函数
  event.waitUntil(
    // 安装成功后操作 CacheStorage 缓存，使用之前需要先通过 caches.open() 打开对应缓存空间。
    caches.open('my-test-cache-v1').then(function (cache) {
      // 通过 cache 缓存对象的 addAll 方法添加 precache 缓存
      return cache.addAll([
        '/',
        '/index.html',
        // '/main.css',
        // '/main.js',
        // '/image.jpg'
      ]);
    })
  );
});
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // 来来来，代理可以搞一些代理的事情

      // 如果 Service Worker 有自己的返回，就直接返回，减少一次 http 请求
      if (response) {
        return response;
      }

      // 如果 service worker 没有返回，那就得直接请求真实远程服务
      var request = event.request.clone(); // 把原始请求拷过来
      return fetch(request).then(function (httpRes) {

        // http请求的返回已被抓到，可以处置了。

        // 请求失败了，直接返回失败的结果就好了。。
        if (!httpRes || httpRes.status !== 200) {
          return httpRes;
        }

        // 请求成功的话，将请求缓存起来。
        var responseClone = httpRes.clone();
        caches.open('my-test-cache-v1').then(function (cache) {
          cache.put(event.request, responseClone);
        });

        return httpRes;
      });
    })
  );
});

// 安装阶段跳过等待，直接进入 active
self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    Promise.all([

      // 更新客户端
      self.clients.claim(),

      // 清理旧版本
      caches.keys().then(function (cacheList) {
        return Promise.all(
          cacheList.map(function (cacheName) {
            if (cacheName !== 'my-test-cache-v1') {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('notificationclick', function (e) {
  var notification = e.notification;
  var primaryKey = notification.data.primaryKey;
  var action = e.action;

  if (action === 'close') {
    notification.close();
  } else {
    clients.openWindow('http://www.baidu.com');
    notification.close();
  }
});

self.addEventListener('push', function (e) {
  let data = JSON.parse(e.data.text());
  let option = typeof data == 'object' ? data : { body: data }
  e.waitUntil(
    self.registration.showNotification('消息提醒', option)
  );
});
