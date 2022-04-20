const bcryptjs  = require("bcryptjs")
const saltRound = 10

const haspPassword = async (pwd) => {
    let  salt = await bcryptjs.genSalt(saltRound)
    let hash = await bcryptjs.hash(pwd,salt)
    return hash
}

const comparePassword = async (pwd,hash) => {
    const comparedResult = await bcryptjs.compare(pwd,hash)
    return comparedResult
}

module.exports = {
    haspPassword,
    comparePassword
}


