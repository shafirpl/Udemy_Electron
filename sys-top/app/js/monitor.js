const path = require('path')
const osu = require('node-os-utils')
const { Notification } = require('electron')
const cpu = osu.cpu
const mem = osu.mem
const os = osu.os
const notifier = require('node-notifier');

let cpuOverload = 10
let alertFreq = 1

// send notification
const notifyUser = (options) => {
    notifier.notify(options)
}

// check how much time has passed since notification
const runNotify = (freq) => {
    if (localStorage.getItem('lastNotify') == null){
        // store timestamp
        localStorage.setItem('lastNotify', +new Date())
        return true
    }
    const notifyTime = new Date(parseInt(localStorage.getItem('lastNotify')))
    const now = new Date()
    const diffTime = Math.abs( now - notifyTime)
    const minutesPassed = Math.ceil(diffTime/ (60*1000))

    if (minutesPassed>freq){
        return true
    }
    return false

}


/*
* for other info, we need to update it at a set interval, so we need to run it every 2 second 
* for which we need to use setInterval function
*/
setInterval(() => {
    // toFixed method: https://www.w3schools.com/JSREF/jsref_tofixed.asp
    

    // cpu usage
    cpu.usage().then(info => {
        document.getElementById('cpu-usage').innerText = `${info.toFixed(2)} %`
        // sets the progress bar
        document.querySelector('#cpu-progress').style.width = `${info}%`

        // make progress bar red if overload
        if (info > cpuOverload){
            document.querySelector('#cpu-progress').style.background = `red`
        } else{
            document.querySelector('#cpu-progress').style.background = `#30c88b`
        }

        if(info > cpuOverload && runNotify(alertFreq)){
            // notify users
            notifyUser({
                title: 'CPU Overload',
                message: `CPU is over ${cpuOverload}%`,
                icon: path.join(__dirname, 'img', 'icon.png')
            })
            localStorage.setItem('lastNotify', +new Date())
        }

    })
    // cpu free
    cpu.free().then(info => {
        document.getElementById('cpu-free').innerText = `${info.toFixed(2)} %`
    })
    // uptime
    document.getElementById('sys-uptime').innerText = convertSecondsToDHMS(os.uptime())
},2000)

// set cpu model
document.getElementById('cpu-model').innerText = cpu.model()

//computer name
document.getElementById('comp-name').innerText = os.hostname()

// os
document.getElementById('os').innerText = `${os.type()} ${os.arch()}`

// total memory
// it returns a promise for which we need to extract the info
mem.info().then(info => {
    // even though it is in mb, it actually gives the info in total gigabyte, which is weird
    document.getElementById('mem-total').innerText = `${info.totalMemMb} GB`
})

// show days, minutes, seconds
const convertSecondsToDHMS = (seconds) => {
    // converting to number, we could use parseInt, don't know why brad uses this weird stuff
    seconds += seconds
    const days = Math.floor(seconds / (3600*24))
    const hours = Math.floor((seconds % (3600*24))/ 3600 )
    const minutes = Math.floor((seconds % 3600) / 60)
    const secondsUptime = Math.floor(seconds % 60)
    return `${days}D,${hours}H,${minutes}M,${secondsUptime}S`
}


