var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
    console.log('请指定端口号，使用格式为\nnode server.js 8888 ')
    process.exit(1)
}

var server = http.createServer(function (request, response) {
    var parsedUrl = url.parse(request.url, true)
    var pathWithQuery = request.url
    var queryString = ''
    if (pathWithQuery.indexOf('?') >= 0) {
        queryString = pathWithQuery.substring(pathWithQuery.indexOf('?'))
    }
    var path = parsedUrl.pathname
    var query = parsedUrl.query
    var method = request.method

    /******** 从这里开始看，上面不要看 ************/
    const session = JSON.parse(fs.readFileSync('./session.json').toString())
    console.log('请求到达，路径（带查询参数）为：' + pathWithQuery)


    // 用户登录 signIn
    if (path === '/signIn' && method === "POST") {
        const userArray = JSON.parse(fs.readFileSync("./db/users.json"))
        const array = [];
        request.on('data', (chunk) => {
            array.push(chunk);
        })
        request.on('end', () => {
            const string = Buffer.concat(array).toString()
            // 获取输入username password
            const obj = JSON.parse(string)
            // 查询userArray中是否存在匹配的user数据
            const user = userArray.find((user) =>
                user.username === obj.username && user.password === obj.password)
            // 不存在返回400
            if (user === undefined) {
                response.statusCode = 400
                response.setHeader('Content-Type', 'text/json;charset=UTF-8')
                response.end(`{"errorCode":5001}`)
            } else {
                // 存在返回200
                response.statusCode = 200
                // 设置cookie，设置成随机的session，保存登录状态同时保证安全性
                const random = Math.random().toString()
                session[random] = {user_id: user.id}
                fs.writeFileSync('./session.json', JSON.stringify(session))
                response.setHeader('Set-Cookie', `session_id=${random};HttpOnly`)
                response.end()
            }
        })
    }


    // 用户主页 home
    // 显示登录状态和用户名
    else if (path === "/home.html") {
        const cookie = request.headers['cookie']
        let sessionId
        // 从cookie中获取sessionId
        try {
            sessionId = cookie
                .split(";")
                .filter(s => s.indexOf("session_id=") >= 0)[0]
                .split("=")[1];
        } catch (error) {
        }
        // 使用find()方法，如果在数据库中查询到user_id，则跳转home.html，显示已登录
        if (sessionId && session[sessionId]) {
            const userId = session[sessionId].user_id
            const userArray = JSON.parse(fs.readFileSync("./db/users.json"))
            const user = userArray.find(user => user.id === userId)
            const homeHtml = fs.readFileSync('./public/home.html').toString()
            let string = ''
            if (user) {
                string = homeHtml.replace('{{loginStatus}}', '已登录')
                    .replace('{{user.name}}', user.username)
                response.write(string)
            }
        } else {
            // 如果在数据库中没有查询到user_id，则跳转home.html，显示未登录
            const homeHtml = fs.readFileSync('./public/home.html').toString()
            string = homeHtml.replace('{{loginStatus}}', '未登录')
                .replace('{{user.name}}', '')
            response.write(string)
        }
        response.end()
    }


    // 用户注册 register
    else if (path === '/register' && method === "POST") {
        response.setHeader('Content-Type', 'text/html;charset=UTF-8')
        // 读取数据库
        const userArray = JSON.parse(fs.readFileSync("./db/users.json"))
        // 读取传输过来的用户数据，并写入array
        const array = [];
        // 将获取的数据一点一点的写入数组
        request.on('data', (chunk) => {
            array.push(chunk);
        })
        // 用户数据获取完毕后，将获取数据转化为string
        request.on('end', () => {
            const string = Buffer.concat(array).toString()
            // 使用JSON.parse()解析转化
            const obj = JSON.parse(string)
            // 设置最后一个用户的id为userArray的长度减一
            const lastUser = userArray[userArray.length - 1]
            // 建立新的用户对象
            const newUser = {
                // id 为最后一个用户的 id + 1
                id: lastUser ? lastUser.id + 1 : 1,
                username: obj.username,
                password: obj.password
            };
            // 将用户信息以对象形式储存进用户数组
            userArray.push(newUser);
            // 使用JSON.stringify()方法，将数组进行反向转化
            const userString = JSON.stringify(userArray)
            // 将对象信息储存进数据库
            fs.writeFileSync('./db/users.json', userString)
            response.end()
        })
    } else {
        response.statusCode = 200
        // 默认首页
        const filePath = path === '/' ? '/index.html' : path
        // lastIndexOf()从字符串末尾开始检索，返回子字符的下标
        const index = filePath.lastIndexOf('.')
        // 返回从指定下标index开始的字符串
        // suffix 是后缀
        const suffix = filePath.substring(index)
        const fileTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.xml': 'text/xml',
            '.json': 'text/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg'
        }
        response.setHeader('Content-Type',
            `${fileTypes[suffix] || 'text/html'};charset=utf-8`)
        let content
        try {
            content = fs.readFileSync(`./public${filePath}`)
        } catch (error) {
            content = '路径不合法'
            response.statusCode = 404
        }
        response.write(content)
        response.end()
    }
    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n端口将打开在： http://localhost:' + port)
