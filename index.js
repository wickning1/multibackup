const Site = require('./lib/site')
const MultiSource = require('./lib/multisource')
const Output = require('./lib/output')
const util = require('./lib/util')
const fs = require('fs')
const config = require('./config.js')

async function main () {
  if (fs.existsSync('./inprogress')) return
  fs.closeSync(fs.openSync('./inprogress', 'w'))
  Output.init()
  const timer = setInterval(Output.draw, 150)
  const source = new MultiSource(config)
  const sites = config.sites.map(siteconfig => new Site(siteconfig, source))
  await Promise.all([
    source.gather(),
    ...sites.map(async function (site) {
      await site.connect()
      await site.snapshot()
      await site.gather()
    })
  ])

  await Promise.all(sites.map(async function (site) {
    await site.delete()
    await site.put()
  }))
  clearInterval(timer)
  Output.close()

  console.log('Done!')
  fs.unlinkSync('./inprogress')
  process.exit()
}

function abort () {
  fs.unlinkSync('./inprogress')
  process.exit(1)
}

process.once('SIGINT', abort)
process.once('SIGTERM', abort)
main().catch(async function (e) {
  console.log(e)
  await util.mail(config, 'Backup Error', e.message + '\n' + (e.stack || (e + '\n' + new Error().stack)))
  abort()
})
