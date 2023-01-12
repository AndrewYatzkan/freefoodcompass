/*
// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
Geolocation code:

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

function success(pos) {
  const crd = pos.coords;

  console.log('Your current position is:');
  console.log(`Latitude : ${crd.latitude}`);
  console.log(`Longitude: ${crd.longitude}`);
  console.log(`More or less ${crd.accuracy} meters.`);
}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}

navigator.geolocation.getCurrentPosition(success, error, options);
*/

document.body.onclick = () => DeviceMotionEvent.requestPermission();

async function init() {
  if (!window.DeviceOrientationEvent ||
      !DeviceMotionEvent.requestPermission ||
      !navigator?.geolocation) { // browser not supported
    // message: Unable to collect compass heading from your device. Check out @UIUCFreeFood instead! Your nearest free food: embedded tweet
    return;
  }
  let perms = await permissionStatus();
  if (perms == 'auto-deny') { // need to restart browser to be prompted again after denying
    // message: fully restart browser and come back
    return;
  }
  if (perms == 'not-prompted') {
    // message: popup explaining app and then ask for permission
    // TODO: don't return, continue (if granted permission)
    return;
  }

  // you have perms!

  setInterval(refreshTargetHeading, REFRESH_INTERVAL);
  refreshTargetHeading();

  window.addEventListener('deviceorientation', async ({webkitCompassHeading}) => {
    let dir = (webkitCompassHeading - targetHeading + 360) % 360;
    setHeading(dir); // snappy
    // lerpTo(dir); // smooth
  });

  let req = await fetch('/events');
  let res = await req.json();

  // Sort:
  // 1. Started. Tie-breaker, ends latest
  // 2. Not started. Tie-breaker, starts soonest

  let now = new Date().getTime();
  let started = res.filter(x => x.start_timestamp <= now);
  let future  = res.filter(x => x.start_timestamp >  now);

  // assignTarget('Champaign, IL', 'Time info', {latitude: 40.116421, longitude: -88.243385});

  if (res.length == 0) {
    // no upcoming events..
    return;
  }

  let event;
  if (started.length > 0) event = started.sort((a, b) => b.end_timestamp - a.end_timestamp)[0];
  else event = started.sort((a, b) => a.start_timestamp - b.start_timestamp)[0];

  let duration = moment.duration(now - event.end_timestamp);
  let timeInfo = `${started.length > 0 ? 'ends' : 'starts'} ${duration.humanize(true)}`;
  assignTarget(event.location, timeInfo, event.coordinates, event.id, event.note || 'N/A');
}

let targetHeading = 0;

init();

/*** Updates ***/

const REFRESH_INTERVAL = 5_000;

let target;
let clientPos;
assignTarget('Loading..', 'N/A', {latitude: 0, longitude: 0});

function assignTarget(name, time, coords, tweet_id='N/A', info='N/A') {
  target = {name, time, info, tweet_id, ...coords};
  syncDOM();
}

function syncDOM() {
  let dist = 'N/A';
  if (clientPos && target?.latitude !== 0) {
    dist = distance(clientPos, target) * 3.28084;
    if (dist >= 5280) dist = `${(dist/5280).toPrecision(4)} mi`;
    else dist = `${Math.floor(dist)} ft`;
  }

  document.querySelector('#name').innerText = target.name;
  document.querySelector('#time').innerText = target.time;
  document.querySelector('#distance').innerText = dist;

  let url = `https://twitter.com/UIUCFreeFood/status/${target.tweet_id}`;
  document.querySelector('.tweet-div').style.display = target.tweet_id == 'N/A' ? 'none' : 'flex';
  document.querySelector('#tweet').innerText = url
  document.querySelector('#tweet').href = url;

  document.querySelector('.info-div').style.display = target.info == 'N/A' ? 'none' : 'flex';
  document.querySelector('#info').innerText = target.info;
}

async function refreshTargetHeading() {
  clientPos = await getGeolocation();
  targetHeading = bearing(clientPos, target);
  syncDOM();
}

/*** DOM ***/

// // TODO: fix crossing 0 => 360 at North
// let curHeading = 0;
// let lerpGoal = 0;
// let lerpInterval = null;
// function lerpTo(dir) {
//   lerpGoal = dir;
//   if (!lerpInterval) {
//     lerpInterval = setInterval(() => {
//       let dist = (lerpGoal - curHeading) * 0.05;
//       curHeading += dist;
//       setHeading(curHeading);
//     }, 1000/60);
//   }
// }

function setHeading(dir) {
  let disc = document.querySelector('.disc');
  disc.style.transform = `rotate(${-dir}deg)`;
  disc.style.webkitTransform = `rotate(${-dir}deg)`;
  disc.style.MozTransform = `rotate(${-dir}deg)`;
}

/*** Utils ***/

// returns {latitude, longitude, accuracy, ...}
async function getGeolocation() {
  let options = {
    enableHighAccuracy: true, // try to use GPS chip
    timeout: REFRESH_INTERVAL,
    maximumAge: 0 // don't use a cached position
  };
  try {
    let pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, options)
    );
    return pos.coords;
  } catch (e) {
    if (e.PERMISSION_DENIED) return false;
    alert(`Unknown error: ${e.message}`)
  }
}

// Haversine formula (note: Vincenty may be marginally better)
function bearing(start, end) {
    let {latitude: startLat, longitude: startLng} = start;
    let {latitude: destLat, longitude: destLng} = end;

    const R = 6371e3; // radius of the Earth in meters
    const rad = deg => deg * Math.PI / 180;
    const deg = rad => rad * 180 / Math.PI;

    startLat = rad(startLat);
    startLng = rad(startLng);
    destLat = rad(destLat);
    destLng = rad(destLng);

    var y = Math.sin(destLng - startLng) * Math.cos(destLat);
    var x = Math.cos(startLat) * Math.sin(destLat) -
            Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    var bearing = Math.atan2(y, x);
    bearing = deg(bearing);
    bearing = (bearing + 360) % 360;

    return bearing;
}

// Haversine formula (note: Vincenty may be marginally better)
function distance(start, end) {
    let {latitude: startLat, longitude: startLng} = start;
    let {latitude: destLat, longitude: destLng} = end;

    const R = 6371e3; // radius of the Earth in meters
    const rad = deg => deg * Math.PI / 180;
    const deg = rad => rad * 180 / Math.PI;

    startLat = rad(startLat);
    startLng = rad(startLng);
    destLat = rad(destLat);
    destLng = rad(destLng);

    var a = Math.pow(Math.sin((destLat - startLat) / 2), 2) +
            Math.pow(Math.sin((destLng - startLng) / 2), 2) *
            Math.cos(startLat) * Math.cos(destLat);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = R * c;

    return distance;
}

/*** Permissions ***/
function permissionStatus() {
  return new Promise((resolve, reject) =>
    DeviceMotionEvent.requestPermission()
      .then(status => resolve(status == 'granted' ? status : 'auto-deny'))
      .catch(() => resolve('not-prompted'))
  );
}
