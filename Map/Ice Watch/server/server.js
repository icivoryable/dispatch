const express = require("express")
const app = express()

app.use(express.json())

let pins = []

app.get("/api/pins",(req,res)=>{

res.json({
role:"admin",
pins
})

})

app.post("/api/pins",(req,res)=>{

const pin = {
id: Date.now().toString(),
...req.body,
status:"Reported",
createdAt:new Date()
}

pins.push(pin)

res.json(pin)

})

app.patch("/api/pins",(req,res)=>{

const {id,newStatus} = req.body

pins = pins.map(p => {
if(p.id === id) p.status = newStatus
return p
})

res.json({ok:true})

})

app.listen(3000,()=>{
console.log("API running on port 3000")
})