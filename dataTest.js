const fs = require('fs')


// 读数据库
const usersString = fs.readFileSync('./db/users.json').toString()
const usersArray = JSON.parse(usersString)


// 写数据库
const user3 = {id: 3, name: 'Sariel', password: '901'}
usersArray.push(user3)
const string = JSON.stringify(usersArray)
fs.writeFileSync('./db/users.json', string)


// 用户数据
// {"id": 1, "name": "Sherry", "password": "107"},
// {"id": 2, "name": "Emerald", "password": "707"},
// {"id": 3, "name": "Sariel", "password": "901"}