const moment = require('dayjs')
const sprintf = require('sprintf-js').sprintf
const term = require('terminal-kit').terminal

let trackers = []
class Output {
  static openTracker(name, goal) {
    const tracker = new Tracker(name, goal)
    trackers.push(tracker)
    return tracker
  }
  static closeTracker(tracker) {
    trackers = trackers.filter(t => t !== tracker)
  }
  static draw() {
    term.clear()
    term.moveTo(1,1)
    for (const tracker of trackers) {
      term(tracker.toString() + '\n')
    }
  }
}

const suffixes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB']
class Tracker {
  constructor(name, goal) {
    this.name = name
    this.goal = goal
    this.goalHuman = this.bytesToHuman(goal)
    this.current = 0
    this.starttime = moment()
  }
  close () {
    Output.closeTracker(this)
  }
  update (value) {
    this.lastupdate = moment()
    this.current = value
  }
  bytesToHuman (bytes) {
    const scale = Math.floor(Math.log(bytes) / Math.log(1024))
    const suffix = suffixes[scale]
    const units = Math.pow(1024, scale)
    const bytesinunits = 1.0 * bytes / units
    return sprintf('%.3g%s', bytesinunits, suffix)
  }
  toString () {
    const now = moment()
    const elapsed = now.diff(this.starttime, 'seconds')
    const progress = (1.0 * this.current) / this.goal
    const persecond = (1.0 * this.current) / elapsed
    const end = now.add((this.goal - this.current) / persecond, 'seconds')
    return sprintf('%2.2f%% (%s / %s) (%s remaining) %s', progress*100, this.bytesToHuman(this.current), this.goalHuman, end.from(now, true), this.name)
  }
}

module.exports = Output
