async function getSick() {
    const response = await fetch("sick.json");
    return response.json()
}

async function getRecovered() {
    const response = await fetch("recovered.json");
    return response.json()
}

async function getDead() {
    const response = await fetch("dead.json");
    return response.json()
}

async function map() {
    d3.select("svg").remove()

    let sick = recovered = dead = STATES.reduce((acc, curr) => { 
        acc[curr] = 0
        return acc
    }, {})

    sick      = await getSick()
    recovered = await getRecovered()
    dead      = await getDead()

    const sickSum      = Object.values(sick).reduce((curr, acc) => { return curr + acc }, 0)
    const recoveredSum = Object.values(recovered).reduce((curr, acc) => { return curr + acc }, 0)
    const deadSum      = Object.values(dead).reduce((curr, acc) => { return curr + acc }, 0)

    document.getElementById("figure").style.display     = ''
    document.getElementById("sick").textContent         = `${sickSum}`
    document.getElementById("recovered").textContent    = `${recoveredSum}`
    document.getElementById("dead").textContent         = `${deadSum}`

    const coordinatesToCoords = (coordinates, axis) => {
        let coords = coordinates[0]
        if (coordinates.length > 1) {
            if (coordinates[0].length > 1) {
                coords = coordinates.reduce((curr, acc) => { return curr.concat(acc) }, [])
            } else {
                coords = coordinates.reduce((curr, acc) => { return curr.concat(acc[0]) }, [])
            }
        }
        if (axis === "x") return coords.map((coord => { return coord[0] }))
        if (axis === "y") return coords.map((coord => { return coord[1] }))
        return coords
    }

    d3.json("AUT_adm1_geo.json", function(error, at) {
        let width  = window.innerWidth,
            height = window.innerHeight

        let projection = d3.geoMercator()
            .center([10, 49])
            .scale(400 * (window.innerWidth / 80))

        const svg = d3.select("body").append("svg")
            .attr("viewbox", `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio','xMinYMin')

        const container = svg.append("g")
            .attr("class", "container")
            .attr("transform", "translate(-100, 0)")

        container.append("g")
            .attr("class", "paths")
            .selectAll("path")
            .data(at.features)
            .enter()
            .append("path")
                .attr("d", d3.geoPath().projection(projection))
                .attr("fill", (d) => {
                    return d3.interpolateOranges(
                        sick[d.properties.NAME_1.toLowerCase()] / sickSum
                    )})
                .style("stroke", "black")

        container.append("g")
            .attr("class", "circles")
            .selectAll("circle")
            .data(at.features)
            .enter()
            .append("circle")
                .attr("cx", (d) => {
                    const X = coordinatesToCoords(d.geometry.coordinates, "x")
                    return projection([d3.mean(X), d3.mean(X)])[0] - 15
                })
                .attr("cy", (d) => {
                    const Y = coordinatesToCoords(d.geometry.coordinates, "y")
                    return projection([d3.mean(Y), d3.mean(Y)])[1]
                })
                .attr("r", (d) => { 
                    let defined = 0
                    if (sick[d.properties.NAME_1.toLowerCase()]) {
                        defined = 1
                    }

                    return (5 * defined) + 10 * (sick[d.properties.NAME_1.toLowerCase()] || 0) / sickSum
                })
                .attr("fill", "red")

        container.append("g")
            .attr("class", "circles")
            .selectAll("circle")
            .data(at.features)
            .enter()
            .append("circle")
                .attr("cx", (d) => {
                    const X = coordinatesToCoords(d.geometry.coordinates, "x")
                    return projection([d3.mean(X), d3.mean(X)])[0] + 15
                })
                .attr("cy", (d) => {
                    const Y = coordinatesToCoords(d.geometry.coordinates, "y")
                    return projection([d3.mean(Y), d3.mean(Y)])[1]
                })
                .attr("r", (d) => {
                    let defined = 0
                    if (recovered[d.properties.NAME_1.toLowerCase()]) {
                        defined = 1
                    }

                    return (5 * defined) + 10 * (recovered[d.properties.NAME_1.toLowerCase()] || 0) / sickSum 
                })
                .attr("fill", "green")

        container.append("g")
            .attr("class", "circles")
            .selectAll("circle")
            .data(at.features)
            .enter()
            .append("circle")
                .attr("cx", (d) => {
                    const X = coordinatesToCoords(d.geometry.coordinates, "x")
                    return projection([d3.mean(X), d3.mean(X)])[0]
                })
                .attr("cy", (d) => {
                    const Y = coordinatesToCoords(d.geometry.coordinates, "y")
                    return projection([d3.mean(Y), d3.mean(Y)])[1] + 20
                })
                .attr("r", (d) => {
                    let defined = 0
                    if (dead[d.properties.NAME_1.toLowerCase()]) {
                        defined = 1
                    }

                    return (5 * defined) + 10 * (dead[d.properties.NAME_1.toLowerCase()] || 0) / sickSum 
                })
                .attr("fill", "black")

        const sickText = container.append("g")
        sickText.append("g")
            .attr("class", "heavy")
            .selectAll("circle")
            .data(at.features)
            .enter()
            .append("rect")
                .attr("x", (d) => {
                    const X = coordinatesToCoords(d.geometry.coordinates, "x")
                    return projection([d3.mean(X), d3.mean(X)])[0] - 50
                })
                .attr("y", (d) => {
                    const Y = coordinatesToCoords(d.geometry.coordinates, "y")
                    return projection([d3.mean(Y), d3.mean(Y)])[1] - 40
                })
                .attr("height", "30px")
                .attr("width", (d) => `${(25 + ((sick[d.properties.NAME_1.toLowerCase()] || 0).toString().length - 1) * 10)}px`)
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("rx", "5px")
                .attr("ry", "5px")
                .style("display", (d) => sick[d.properties.NAME_1.toLowerCase()] !== undefined ? '' : 'none')
        
        sickText.append("g")
            .attr("class", "heavy")
            .selectAll("circle")
            .data(at.features)
            .enter()
            .append("text")
                .attr("x", (d) => {
                    const X = coordinatesToCoords(d.geometry.coordinates, "x")
                    return projection([d3.mean(X), d3.mean(X)])[0] - 45
                })
                .attr("y", (d) => {
                    const Y = coordinatesToCoords(d.geometry.coordinates, "y")
                    return projection([d3.mean(Y), d3.mean(Y)])[1] - 20
                })
                .text((d) => { return sick[d.properties.NAME_1.toLowerCase()] })

        const recoveredText = container.append("g")
        recoveredText.append("g")
            .attr("class", "heavy")
            .selectAll("circle")
            .data(at.features)
            .enter()
            .append("rect")
                .attr("x", (d) => {
                    const X = coordinatesToCoords(d.geometry.coordinates, "x")
                    return projection([d3.mean(X), d3.mean(X)])[0] + 15
                })
                .attr("y", (d) => {
                    const Y = coordinatesToCoords(d.geometry.coordinates, "y")
                    return projection([d3.mean(Y), d3.mean(Y)])[1] - 40
                })
                .attr("height", "30px")
                .attr("width", (d) => `${(25 + ((recovered[d.properties.NAME_1.toLowerCase()] || 0).toString().length - 1) * 10)}px`)
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("rx", "5px")
                .attr("ry", "5px")
                .style("display", (d) => recovered[d.properties.NAME_1.toLowerCase()] !== undefined ? '' : 'none')

        recoveredText.append("g")
            .attr("class", "heavy")
            .selectAll("circle")
            .data(at.features)
            .enter()
                .append("text")
                .text((d) => { return recovered[d.properties.NAME_1.toLowerCase()] })
                .attr("x", (d) => {
                    const X = coordinatesToCoords(d.geometry.coordinates, "x")
                    return projection([d3.mean(X), d3.mean(X)])[0] + 20
                })
                .attr("y", (d) => {
                    const Y = coordinatesToCoords(d.geometry.coordinates, "y")
                    return projection([d3.mean(Y), d3.mean(Y)])[1] - 20
                })

        const deadText = container.append("g")
        deadText.append("g")
            .attr("class", "heavy")
            .selectAll("circle")
            .data(at.features)
            .enter()
            .append("rect")
                .attr("x", (d) => {
                    const X = coordinatesToCoords(d.geometry.coordinates, "x")
                    return projection([d3.mean(X), d3.mean(X)])[0] - 15
                })
                .attr("y", (d) => {
                    const Y = coordinatesToCoords(d.geometry.coordinates, "y")
                    return projection([d3.mean(Y), d3.mean(Y)])[1] + 35
                })
                .attr("height", "30px")
                .attr("width", (d) => `${(25 + ((dead[d.properties.NAME_1.toLowerCase()] || 0).toString().length - 1) * 10)}px`)
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("rx", "5px")
                .attr("ry", "5px")
                .style("display", (d) => dead[d.properties.NAME_1.toLowerCase()] !== undefined ? '' : 'none')

        deadText.append("g")
            .attr("class", "heavy")
            .selectAll("circle")
            .data(at.features)
            .enter()
                .append("text")
                .text((d) => { return dead[d.properties.NAME_1.toLowerCase()] })
                .attr("x", (d) => {
                    const X = coordinatesToCoords(d.geometry.coordinates, "x")
                    return projection([d3.mean(X), d3.mean(X)])[0] - 10
                })
                .attr("y", (d) => {
                    const Y = coordinatesToCoords(d.geometry.coordinates, "y")
                    return projection([d3.mean(Y), d3.mean(Y)])[1] + 55
                })
    })
}