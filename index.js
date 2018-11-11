const Site = require('./lib/site')
const MultiSource = require('./lib/multisource')

async function main() {
  const config = require('./config.js')
  const source = new MultiSource(config.sources)
  await source.gather()

  const sites = config.sites.map(siteconfig => new Site(siteconfig, source))
  await Promise.all(sites.map(async function (site) {
    await site.connect()
    await site.snapshot()
    await site.gather()
    await site.delete()
    await site.put()
  }))
  process.exit()
}

main().catch(function (e) {
  console.log(e)
  process.exit()
})
