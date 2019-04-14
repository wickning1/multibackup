const fs = require('fs')

const log = fs.openSync('./debug.log', 'w')

module.exports = (...lines) => {
  fs.writeSync(log, `${JSON.stringify(lines, null, 2)}\n`)
}
