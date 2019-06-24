let education
let counties

//create canvas
const svg = d3.select("#mapUSA")
    .append("svg")
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('viewBox', '-100 -50 1200 615')

//get the data
const data = [
    'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json',
    'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json',
];

Promise.all(data.map(url => d3.json(url))).then(values => {
    counties = values[0]
    education = values[1]
    populateMap();
}).catch(() => {
    alert('Information cannot be found');
});

//create the legend and the map
function populateMap() {
    const minResult = d3.min(education, d => d.bachelorsOrHigher);
    const maxResult = d3.max(education, d => d.bachelorsOrHigher);


    const colorScale = d3.scaleThreshold()
        .domain(d3.range(minResult, maxResult, (maxResult - minResult) / 8))
        .range(d3.schemeOranges[9]);


    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .attr("id", "tooltip")
        .style("opacity", 0);


    const legendScale = d3.scaleLinear()
        .domain([minResult, maxResult])
        .rangeRound([600, 900])

    const legendXAxis = d3.axisBottom(legendScale)
        .tickSize(13)
        .tickFormat(function (legendScale) { return Math.round(legendScale) + '%' })
        .tickValues(colorScale.domain());


    const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", "translate(0,20)")
        .call(legendXAxis);


    legend.selectAll("rect")
        .data(colorScale.range().map((d) => {
            d = colorScale.invertExtent(d);
            if (d[0] == null) d[0] = legendScale.domain()[0];
            if (d[1] == null) d[1] = legendScale.domain()[1];
            return d;
        }))
        .enter()
        .append("rect")
        .attr("height", 7)
        .attr("x", d => legendScale(d[0]))
        .attr("width", d => legendScale(d[1]) - legendScale(d[0]))
        .attr("fill", d => colorScale(d[0]));

    const geoPath = d3.geoPath()
    svg.append("g")
        .selectAll("geoPath")
        .data(topojson.feature(counties, counties.objects.counties).features)
        .enter()
        .append("path")
        .attr("d", geoPath)
        .attr("class", "county")
        .attr("data-fips", d => d.id)
        .attr("data-education", function (d) {
            const result = education.filter(function (obj) {
                return obj.fips == d.id;
            });
            if (result[0]) {
                return result[0].bachelorsOrHigher
            }
        })
        .attr("fill", function (d) {
            const result = education.filter(function (obj) {
                return obj.fips == d.id;
            });
            if (result[0]) {
                return colorScale(result[0].bachelorsOrHigher)
            }
        })
        .on("mouseover", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 10);
            tooltip.html(function () {
                const result = education.filter(function (obj) {
                    return obj.fips == d.id;
                });
                if (result[0]) {
                    return result[0]['area_name'] + ',' + 'State: ' + result[0]['state'] + ',' + 'Result: ' + result[0].bachelorsOrHigher + '%'
                }
            })
                .style("left", d3.event.pageX + 10 + "px")
                .style("top", d3.event.pageY + 10 + "px")
            tooltip.attr("data-education", function () {
                var result = education.filter(function (obj) {
                    return obj.fips == d.id;
                });
                if (result[0]) {
                    return result[0].bachelorsOrHigher
                }
            })
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    svg.selectAll("geoPath")
        .data(topojson.feature(counties, counties.objects.states).features)
        .enter()
        .append("path")
        .attr("class", "state-borders")
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", geoPath);
};
