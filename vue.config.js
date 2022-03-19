module.exports = {
    // lintOnSave:false, //关闭语法检查
    publicPath : process.env.NODE_ENV === 'production' ? './' : '/',
    outputDir: 'dist',
}