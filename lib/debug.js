const fs = require('fs')

const log = fs.openSync('./debug.log', 'w')

module.exports = (...lines) => {
  for (const line of lines) {
    fs.writeSync(log, `${line}\n`)
  }
}
