const moment = require('dayjs')
const sprintf = require('sprintf-js')
const term = require('terminal-kit').terminal

const trackers = []
class Output {
  static getTracker(name, goal) {
    const tracker = new Tracker(this, name, goal)
    trackers.push(tracker)
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

class Tracker {
  constructor(output, name, goal) {
    this.output = output
    this.name = name
    this.goal = goal
    this.current = 0
    this.starttime = moment()
  }
  close() {
    this.output.closeTracker(this)
  }
  update(value) {
    this.lastupdate = moment()
    this.current = value
  }
  toString() {
    const now = moment()
    const elapsed = now.diff(this.starttime, 'seconds')
    const progress = (1.0 * this.current) / this.goal
    const persecond = (1.0 * this.current) / elapsed
    const end = now.add((this.goal - this.current) / persecond, 'seconds')
    return sprintf('%2.2f %s (%s remaining)', progress, this.name, end.from(now, true))
  }
}

module.exports = Output
