const moment = require('dayjs')
const sprintf = require('sprintf-js').sprintf
const term = require('terminal-kit').terminal
const util = require('./util')

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
  static init() {
    term.clear()
  }
  static draw() {
    term.eraseDisplay()
    for (const tracker of trackers) {
      term(tracker.toString() + '\n')
    }
  }
}

class Tracker {
  constructor(name, goal) {
    this.name = name
    this.goal = goal
    this.goalHuman = util.bytesToHuman(goal)
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
  toString () {
    const now = moment()
    const elapsed = now.diff(this.starttime) / 1000.0
    const progress = (100.0 * this.current) / this.goal
    const remaining = this.current ? util.secondsToHuman((this.goal - this.current) * elapsed / this.current) : 'calculating'
    return sprintf('%2.2f%% (%s / %s) (%s remaining) %s', progress, util.bytesToHuman(this.current), this.goalHuman, remaining, this.name)
  }
}

module.exports = Output
