const path = require("path");
const osu = require("node-os-utils");
const { Notification, ipcRenderer } = require("electron");

const cpu = osu.cpu;
const mem = osu.mem;
const os = osu.os;
const notifier = require("node-notifier");

const si = require("systeminformation");

// initalizing socket io connection with server
const socket = io('http://localhost:5500')

let cpuOverload;
let alertFreq;
let physicalCpuCount;

let memFree;
let cpuUsage;
let cpuFree;
let memUsage;
let compName;
let cpuModel;
let totalMem;
let uptime;

const sendData = () => {
  /* 
  * stackoverflow.com/questions/10600496/sending-messages-client-server-client-on-socket-io-on-node-js/10600926
  * this explains how we send and recieve data back and forth from the server
  */
  socket.emit('data', {
    compName,
    totalMem,
    cpuUsage,
    cpuFree,
    cpuModel,
    memUsage,
    memFree,
    uptime,
  });
  console.log("data emitted")
} 

let setCpuModel = async () => {
  try {
    const data = await si.cpu();
    physicalCpuCount = data.physicalCores;
    cpuModel = cpu.model();
    // set cpu model
    document.getElementById(
      "cpu-model"
    ).innerText = `${cpuModel}\n ${physicalCpuCount} Cores/ ${cpu.count()} Threads `;
  } catch (e) {
    console.log(e);
  }
};

// get settings and values
ipcRenderer.on("settings:get", (e, settings) => {
  // + sign converts it to a number, but we could also use parseInt or Number function for that,
  // don't know why brad uses this
  cpuOverload = +settings.cpuOverload;
  alertFreq = +settings.alertFrequency;
});

// send notification
const notifyUser = (options) => {
  notifier.notify(options);
};

// check how much time has passed since notification
const runNotify = (freq) => {
  if (localStorage.getItem("lastNotify") == null) {
    // store timestamp
    localStorage.setItem("lastNotify", +new Date());
    return true;
  }
  const notifyTime = new Date(parseInt(localStorage.getItem("lastNotify")));
  const now = new Date();
  const diffTime = Math.abs(now - notifyTime);
  const minutesPassed = Math.ceil(diffTime / (60 * 1000));

  if (minutesPassed > freq) {
    return true;
  }
  return false;
};

setCpuModel();

/*
 * for other info, we need to update it at a set interval, so we need to run it every 2 second
 * for which we need to use setInterval function
 */
setInterval(() => {
  // toFixed method: https://www.w3schools.com/JSREF/jsref_tofixed.asp
  //  si.mem().then((data) => 
  //  {console.log(data.free/(1000*1000*100))});

    // mem usage
    mem.info().then((info) => {
      memUsage = `${(100 - info.freeMemPercentage).toFixed(2)}% | ${(
        info.usedMemMb / 1024
      ).toFixed(2)}GB`;
      memFree = `${info.freeMemPercentage.toFixed(2)}% | ${(
        info.freeMemMb / 1000
      ).toFixed(2)}GB`;

      document.getElementById("mem-usage").innerText = `${
        (100 - info.freeMemPercentage).toFixed(2)
      }% | ${(info.usedMemMb/1024).toFixed(2)}GB`;
      document.getElementById('mem-free').innerText = `${(info.freeMemPercentage).toFixed(2)}% | ${(info.freeMemMb/1000).toFixed(2)}GB`
    });

  // cpu usage
  cpu.usage().then((info) => {
    cpuUsage = `${info.toFixed(2)} %`;
    document.getElementById("cpu-usage").innerText = `${info.toFixed(2)} %`;
    // sets the progress bar
    document.querySelector("#cpu-progress").style.width = `${info}%`;

    // make progress bar red if overload
    if (info > cpuOverload) {
      document.querySelector("#cpu-progress").style.background = `red`;
    } else {
      document.querySelector("#cpu-progress").style.background = `#30c88b`;
    }

    if (info > cpuOverload && runNotify(alertFreq)) {
      // notify users
      notifyUser({
        title: "CPU Overload",
        message: `CPU is over ${cpuOverload}%`,
        icon: path.join(__dirname, "img", "icon.png"),
      });
      localStorage.setItem("lastNotify", +new Date());
    }
  });
  // cpu free
  cpu.free().then((info) => {
    cpuFree = `${info.toFixed(2)} %`;
    document.getElementById("cpu-free").innerText = `${info.toFixed(2)} %`;
  });
  // uptime
  uptime = convertSecondsToDHMS(os.uptime());
  document.getElementById("sys-uptime").innerText = uptime;

  sendData();
}, 2000);

//computer name
document.getElementById("comp-name").innerText = os.hostname();
compName = os.hostname();

// os
document.getElementById("os").innerText = `${os.type()} ${os.arch()}`;

// total memory
// it returns a promise for which we need to extract the info
mem.info().then((info) => {
  totalMem = info.totalMemMb / 1024
  totalMem.toFixed(2)
  document.getElementById("mem-total").innerText = `${totalMem}GB`;
});

// show days, minutes, seconds
const convertSecondsToDHMS = (seconds) => {
  // converting to number, we could use parseInt, don't know why brad uses this weird stuff
  seconds += seconds;
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsUptime = Math.floor(seconds % 60);
  return `${days}D,${hours}H,${minutes}M,${secondsUptime}S`;
};
