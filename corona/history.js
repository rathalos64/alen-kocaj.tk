function history_time(groupBy) {
    history(document.getElementById("flag").value, groupBy)
}

function history(state = "all", groupBy="hour") {
    d3.select("svg").remove()

    let timeString = ""
    let file       = ""
    if (groupBy === "hour") timeString = "%Y-%m-%d %H", file = "history_hour.json"
    if (groupBy === "day") timeString = "%Y-%m-%d", file = "history_day.json"

    let width  = window.innerWidth,
        height = window.innerHeight

    let margin = {top: 300, right: 150, bottom: 150, left: 400}
        width = width - margin.left - margin.right,
        height = height - margin.top - margin.bottom;

    const svg = d3.select("body").append("svg")
        .attr("viewbox", `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio','xMinYMin')

    const container = svg.append("g")
        .attr("class", "container")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    ["all"].concat(STATES).forEach((s) => {
        document.getElementById(`flag_${s}`).style.border = ""
    })
    document.getElementById(`flag_${state}`).style.border = "2px solid grey";
    document.getElementById("flag").value = state;

    d3.json(file + '?' + Math.floor(Math.random() * 1000), function (error, historic) {
        let formatted = Object.keys(historic).map((h) => {
            let sick = recovered = 0
            
            if (state === "all") {
                sick = STATES.reduce((acc, curr) => {
                    let sickn = 0
                    if (historic[h]["sick"]) {
                        sickn = historic[h]["sick"][curr] || 0
                    }

                    return (acc + sickn)
                }, 0)
                recovered = STATES.reduce((acc, curr) => {
                    let recoveredn = 0
                    if (historic[h]["recovered"]) {
                        recoveredn = historic[h]["recovered"][curr] || 0
                    }

                    return (acc + recoveredn)
                }, 0)
                dead = STATES.reduce((acc, curr) => {
                    let deadn = 0
                    if (historic[h]["dead"]) {
                        deadn = historic[h]["dead"][curr] || 0
                    }

                    return (acc + deadn)
                }, 0)
            } else {
                let sickn = 0
                let recoveredn = 0
                let deadn = 0

                if (historic[h]["sick"]) {
                    sickn = historic[h]["sick"][state] || 0
                }
                if (historic[h]["recovered"]) {
                    recoveredn = historic[h]["recovered"][state] || 0
                }
                if (historic[h]["dead"]) {
                    deadn = historic[h]["dead"][state] || 0
                }

                sick = sickn
                recovered = recoveredn
                dead = deadn
            }

            return {
                date: d3.timeParse(timeString)(h),
                sick: sick,
                recovered: recovered,
                dead: dead
            }
        })
        formatted.sort((a, b) => a.date - b.date)

        const stacked = d3.stack().keys(["dead", "sick", "recovered"])(formatted)
        const x = d3.scaleTime()
            .domain(d3.extent(formatted, function(d) { return d.date; }))
            .range([ 0, width ])
        container.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));
        container.append("text")             
            .attr("transform", `translate(${(width  /2)}, ${(height + 60)})`)
            .style("text-anchor", "middle")
            .style("font-family", "sans-serif")
            .text("Date")
            
        const y = d3.scaleLinear()
            .domain([0, d3.max(formatted, function(d) { return +d.sick; })])
            .range([ height, 0 ]);
        container.append("g")
            .call(d3.axisLeft(y));
        container.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - 70)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-family", "sans-serif")
            .text("Cases")

        const color = {
            "sick": "#e65c5c",
            "recovered": "#5ce691",
            "dead": "#1f0c0c"
        }

        container.selectAll("stacked")
            .data(stacked)
            .enter()
            .append("path")
            .style("fill", function(d) { return color[d.key] })
            .style("stroke", "grey")
            .attr("d", d3.area()
                .x(function(d, i) { return x(d.data.date) })
                .y0(function(d) { return y(d[0]) })
                .y1(function(d) { return y(d[1]) }))
    })
}