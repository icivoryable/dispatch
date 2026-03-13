let reports = []
let buffer = []

const BATCH_INTERVAL = 90000
const EXPIRATION = 24 * 60 * 60 * 1000

function jitter(coord) {
  const offset = (Math.random() - 0.5) * 0.001
  return coord + offset
}

function cleanExpired() {
  const now = Date.now()
  reports = reports.filter(r => now - r.timestamp < EXPIRATION)
}

setInterval(() => {
  reports.push(...buffer)
  buffer = []
}, BATCH_INTERVAL)

export default function handler(req, res) {

  cleanExpired()

  if (req.method === "GET") {

    return res.json({
      pins: reports
    })

  }

  if (req.method === "POST") {

    const token = req.headers["dispatcher-token"]

    if (token !== process.env.DISPATCHER_SECRET) {
      return res.status(403).json({error:"Unauthorized"})
    }

    const body = req.body

    const report = {

      id: Date.now(),

      lat: jitter(body.lat),
      lng: jitter(body.lng),

      count: body.count,
      equipment: body.equipment,
      actions: body.actions,
      location: body.location,

      timestamp: Date.now()

    }

    buffer.push(report)

    return res.json({status:"queued"})
  }

}