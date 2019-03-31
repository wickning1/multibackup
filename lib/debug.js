const fs = require('fs')

const log = fs.openSync('./debug.log', 'w')

module.exports = line => {
  fs.writeSync(log, `${line}\n`)
}
