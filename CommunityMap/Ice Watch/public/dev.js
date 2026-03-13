const { exec } = require("child_process")

exec("python3 -m http.server 8000")

setTimeout(()=>{
exec("open http://localhost:8000")
},1000)