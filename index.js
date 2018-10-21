const Site = require('./lib/site.js')
const MultiSource = require('./lib/multisource.js')

const config = {
  sources: [
    '/mnt/storage'
  ],
  sites: [{
    redundancy: 2,
    servers: [{
      user: 'ubuntumedia',
      host: '192.168.0.48',
      keyfile: '~/.ssh/id_rsa',
      disks: [{
        path: '/media/storage/backups'
      }]
    }]
  }]
}

async function main() {
  const source = new MultiSource(config.sources)
  await source.gather()

  const sites = config.sites.map(siteconfig => new Site(siteconfig, source))
  await Promise.all(sites.map(async function (site) {
    await site.connect()
    await site.snapshot()
    await site.gather()
/*
    await site.delete()
    await site.put()
*/
  }))
  process.exit()
}

main().catch(function (e) {
  console.log(e)
})
