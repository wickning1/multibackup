const Site = require('./lib/site')
const MultiSource = require('./lib/multisource')
const Output = require('./lib/output')
const util = require('./lib/util')

async function main() {
  Output.init()
  const timer = setInterval(Output.draw, 150)

  const config = require('./config.js')
  const source = new MultiSource(config.sources)
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
  process.exit()
}

main().catch(function (e) {
  console.log(e)
  process.exit(1)
})
