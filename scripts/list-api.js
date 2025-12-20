const fs = require("fs")
const path = require("path")

const BASE = path.join(process.cwd(), "src/app/api")

function scan(dir, url = "") {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const full = path.join(dir, file)

    if (fs.statSync(full).isDirectory()) {
      scan(full, url + "/" + file)
    }

    if (file === "route.ts") {
      const content = fs.readFileSync(full, "utf8")

      const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]
      methods.forEach(method => {
        const regex = new RegExp(`export\\s+(async\\s+)?function\\s+${method}`)
        if (regex.test(content)) {
          console.log(
            `${method.padEnd(7)} /api${url}`
              .replace(/\[([^\]]+)\]/g, ":$1")
          )
        }
      })
    }
  })
}

scan(BASE)