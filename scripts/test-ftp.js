const ftp = require("basic-ftp")

async function evaluate() {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "69.6.201.8", // ns00022.hostgator.mx (sh00022.mx)
            user: "ia@arkhegroup.com",
            password: "W3q@fctyJDc9@",
            secure: false
        })
        console.log(await client.list())
        await client.cd("public_html")
        console.log(await client.list())
    }
    catch(err) {
        console.log(err)
    }
    client.close()
}

evaluate()
