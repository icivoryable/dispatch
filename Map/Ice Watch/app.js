dayjs.extend(dayjs_plugin_relativeTime)

let map
let markers
let heatLayer

let dropMode=false
let lowDataMode=false
let userRole="observer"

let pins=[]
let selectedPin=null

const statusEl=document.getElementById("status")
const recentList=document.getElementById("recentList")

function setStatus(t){
statusEl.textContent=t
}

function initMap(){

map=L.map("map").setView([27.9506,-82.4572],12)

markers=L.layerGroup().addTo(map)

const osm=L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{maxZoom:19}
)

const dark=L.tileLayer(
"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
{maxZoom:19}
)

osm.addTo(map)

map.layers=[osm,dark]
map.currentLayer=0

map.on("click",mapClick)
}

function toggleLayer(){

map.removeLayer(map.layers[map.currentLayer])

map.currentLayer=(map.currentLayer+1)%map.layers.length

map.layers[map.currentLayer].addTo(map)

}

function toggleLowData(){

lowDataMode=!lowDataMode

setStatus(lowDataMode?"Low Data Mode On":"Low Data Mode Off")

}

function mapClick(e){

if(!dropMode) return

openReportDialog(e.latlng)

dropMode=false

}

function toggleDropMode(){

dropMode=!dropMode

setStatus(dropMode?"Click map to report":"Ready")

}

function openReportDialog(latlng){

const count=prompt("Count (people/vehicles)")

const location=prompt("Location (address or landmark)")

const equipment=prompt("Equipment (vehicles/tools/weapons)")

const actions=prompt("Actions observed")

const reportTime=prompt("Observation time",new Date().toLocaleTimeString())

submitReport({
lat:latlng.lat,
lng:latlng.lng,
count,
location,
equipment,
actions,
reportTime
})

}

function privacyJitter(lat,lng){

if(!lowDataMode) return [lat,lng]

const jitter=0.001

lat+=((Math.random()-0.5)*jitter)

lng+=((Math.random()-0.5)*jitter)

return [lat,lng]

}

async function submitReport(data){

const code=sessionStorage.getItem("map_access_code")

const res=await fetch("/api/pins",{

method:"POST",

headers:{
"Content-Type":"application/json",
"x-access-code":code
},

body:JSON.stringify(data)

})

if(!res.ok){
setStatus("Report failed")
return
}

const pin=await res.json()

pins.push(pin)

renderPins()

}

function renderPins(){

markers.clearLayers()

pins.forEach(p=>{

if(Date.now()-new Date(p.createdAt) > 86400000)
return

let [lat,lng]=privacyJitter(p.lat,p.lng)

const marker=L.marker([lat,lng])

marker.on("click",()=>{

selectedPin=p

if(userRole==="admin")
document.getElementById("dispatcherPanel").classList.remove("hidden")

})

marker.bindPopup(`
<b>${p.status}</b><br>
${p.location}<br>
${dayjs(p.createdAt).fromNow()}
`)

marker.addTo(markers)

})

updateRecent()

}

function updateRecent(){

recentList.innerHTML=""

pins.slice(-10).reverse().forEach(p=>{

const div=document.createElement("div")

div.className="reportItem"

div.textContent=
`${dayjs(p.createdAt).fromNow()} — ${p.location}`

div.onclick=()=>{

map.flyTo([p.lat,p.lng],16)

}

recentList.appendChild(div)

})

}

function setPinStatus(status){

if(!selectedPin) return

updatePin(selectedPin.id,status)

}

async function updatePin(id,newStatus){

const code=sessionStorage.getItem("map_access_code")

await fetch("/api/pins",{

method:"PATCH",

headers:{
"Content-Type":"application/json",
"x-access-code":code
},

body:JSON.stringify({id,newStatus})

})

loadPins()

}

async function loadPins(){

const code=sessionStorage.getItem("map_access_code")

const res=await fetch("/api/pins",{headers:{"x-access-code":code}})

if(res.status===401){
logout()
return
}

const data=await res.json()

pins=data.pins

userRole=data.role

renderPins()

}

async function searchLocation(){

const q=document.getElementById("searchInput").value

if(!q) return

const query=encodeURIComponent(q)

const res=await fetch(
`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
)

const data=await res.json()

if(!data.length){
setStatus("Location not found")
return
}

const lat=parseFloat(data[0].lat)
const lon=parseFloat(data[0].lon)

map.flyTo([lat,lon],16)

}

function toggleHeatmap(){

alert("Heatmap placeholder – integrate Leaflet heat plugin")

}

async function checkAccess(){
    connectLive()

const code=document.getElementById("accessCodeInput").value

if(!code) return

sessionStorage.setItem("map_access_code",code)

document.getElementById("login-screen").style.display="none"
document.getElementById("main-app").classList.remove("hidden")

initMap()

await loadPins()

}

function logout(){

sessionStorage.removeItem("map_access_code")

location.reload()

}

window.onload=()=>{

if(sessionStorage.getItem("map_access_code"))
checkAccess()

}

const { queuePin } = require("./live")

app.post("/api/pins", async(req,res)=>{

const pin = await savePin(req.body)

queuePin(pin)

res.json(pin)

})

let socket

function connectLive(){

socket = new WebSocket("wss://yourdomain.com/live")

socket.onopen = ()=>{
console.log("Live updates connected")
}

socket.onmessage = event => {

const data = JSON.parse(event.data)

if(data.type === "batch_pins"){

data.pins.forEach(pin=>{
pins.push(pin)
})

renderPins()

}

}

socket.onclose = ()=>{
setTimeout(connectLive,5000)
}

}

let liveMode=true

function toggleLive(){

liveMode=!liveMode

setStatus(liveMode ? "Live updates enabled" : "Live updates paused")

}

if(!liveMode) return

setInterval(()=>{

submitReport({
lat:27.95 + (Math.random()-0.5)*0.02,
lng:-82.45 + (Math.random()-0.5)*0.02,
location:"Test Area",
actions:"Testing"
})

},15000)