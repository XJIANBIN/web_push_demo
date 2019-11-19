let path = require('path');
let glob = require('glob');
let entriesObj = getView('./src/js/*.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
  entry: entriesObj,
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    port: 8084,//控制端口
    contentBase: './dist',
    proxy: {
      '/api': {
        target: 'http://localhost:3111',
        pathRewrite: { '^/api': '' },
        changeOrigin: true,
        secure: false, // 接受 运行在 https 上的服务
      }
    },
  },

  plugins: [],
};
module.exports = config

/**
*
* @param {string}  globPath  文件的路径
* @returns entries
*/
function getView(globPath, flag) {
  let files = glob.sync(globPath);

  let entries = {},
    entry, dirname, basename, pathname, extname;

  files.forEach(item => {
    entry = item;
    dirname = path.dirname(entry);//当前目录
    extname = path.extname(entry);//后缀
    basename = path.basename(entry, extname);//文件名
    pathname = path.join(dirname, basename);//文件路径
    if (extname === '.html') {
      entries[pathname] = './' + entry;
    } else if (extname === '.js') {
      entries[basename] = entry;
    }
  });

  return entries;
}
let pages = Object.keys(getView('./src/*html'));

pages.forEach(pathname => {
  let htmlname = pathname.split('src\\')[1];
  let conf = {
    filename: `${htmlname}.html`,
    template: `${pathname}.html`,
    hash: true,
    chunks: [htmlname],
    minify: {
      removeAttributeQuotes: true,
      removeComments: true,
      collapseWhitespace: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    }
  }

  config.plugins.push(new HtmlWebpackPlugin(conf));
});