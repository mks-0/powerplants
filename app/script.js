async function loadData() {
  try {
    const [geojson, csvData, powerplantsData] = await Promise.all([
      d3.json("Data/europe.geojson"),
      d3.csv("Data/jrc_countries.csv"),
      d3.csv("Data/jrc_powerplants.csv")
    ]);

    powerplantsData.forEach(d => {
      d.lat = +d.lat;
      d.lon = +d.lon;
      d['co2emitted'] = +d['co2emitted'];
    });

    // Process country emissions data
    const emissionDataMap = new Map(csvData.map(d => [d['Country'], +d['Emissions']]));

    geojson.features.forEach(feature => {
      const countryName = feature.properties.NAME;
      feature.properties.Emissions = emissionDataMap.has(countryName) ? emissionDataMap.get(countryName) : 0;
    });

    // SVG setup
    const svgWidth = 1000;
    const svgHeight = 1000;
    const svg = d3.select("#map").append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

    // Map setup
    const projection = d3.geoMercator().fitSize([svgWidth, svgHeight], geojson);
    const geoGenerator = d3.geoPath().projection(projection);
    const mapGroup = svg.append("g");

    // Color scale for map
    const mapColorScale = d3.scaleSequential(d3.interpolateRgbBasis(["#32ba56", "#e3eb0c", "#edbf05", "#f58905", "#f73a00"]))
      .domain(d3.extent(geojson.features, d => d.properties.Emissions));

    // Join the FeatureCollection's features array to path elements
    mapGroup.selectAll('path')
      .data(geojson.features)
      .enter()
      .append('path')
      .attr('d', geoGenerator)
      .style('fill', d => (d.properties.Emissions === 0) ? 'grey' : mapColorScale(d.properties.Emissions))
      .style('stroke', 'white');

    // Continuous Color Scale Legend
    const legendGroup = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${svgWidth * 0.02}, ${svgHeight * 0.05})`);

    const legendGradient = legendGroup.append('defs')
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    legendGradient.selectAll('stop')
      .data(mapColorScale.ticks(20))
      .enter().append('stop')
      .attr('offset', (d, i) => i / (mapColorScale.ticks(20).length - 1))
      .attr('stop-color', d => mapColorScale(d));

    legendGroup.append('rect')
      .attr('width', 200)
      .attr('height', 20)
      .style('fill', 'url(#legend-gradient)')
      .attr("transform", `translate(${svgWidth * -0.2}, ${svgHeight * 0})`);

    const legendLabels = [mapColorScale.domain()[0], (mapColorScale.domain()[1] / 1e6)];

    legendGroup.selectAll('.legend-text')
      .data(legendLabels)
      .enter().append('text')
      .attr('class', 'legend-text')
      .attr('x', (d, i) => (i == 0) ? svgWidth * -0.2 : svgWidth * -0.06)
      .attr('y', 40)
      .attr('dy', '0.35em')
      .text(d => d3.format(".0f")(d) + " Mt");

    legendGroup.append('text')
      .attr('class', 'legend-title')
      .attr('x', svgWidth * -0.11)
      .attr('y', svgHeight * -0.01)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .text('CO2 Emitted per year');

    // Powerplants data processing
    const sizeScale = d3.scaleLinear()
      .domain(d3.extent(powerplantsData, d => d['co2emitted']))
      .range([4, 13]);

    const typeColorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(powerplantsData.map(d => d['type_g']));

    // Add a group element for the type_g legend
    const typeLegendGroup = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${svgWidth * 1}, ${svgHeight * 0.05})`);

    typeLegendGroup.selectAll('.legend-circle')
      .data(typeColorScale.domain())
      .enter().append('circle')
      .attr('class', 'legend-circle')
      .attr('cx', 10)
      .attr('cy', (d, i) => i * 30 + 10)
      .attr('r', 10)
      .style('fill', d => typeColorScale(d));

    typeLegendGroup.selectAll('.legend-text')
      .data(typeColorScale.domain())
      .enter().append('text')
      .attr('class', 'legend-text')
      .attr('y', (d, i) => i * 30 + 15)
      .attr('x', 25)
      .attr('dx', '0.35em')
      .style('text-anchor', 'left')
      .text(d => d);

    const markerGroup = svg.append("g");

    markerGroup.selectAll("circle")
      .data(powerplantsData)
      .enter()
      .append("circle")
      .attr("cx", d => projection([d.lon, d.lat])[0])
      .attr("cy", d => projection([d.lon, d.lat])[1])
      .attr("r", d => sizeScale(d['co2emitted']))
      .style("fill", d => {
        const rgbColor = d3.color(typeColorScale(d['type_g'])).rgb();
        return `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.8)`;
      })
      .style("stroke", "blue")
      .style("stroke-width", 1)
      .on("mouseover", function (d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`${d['country']}<br>${d['name_p']}<br>`
        +`CO2 Emitted:${d3.format(",.0f")(d['co2emitted'] / 1000)} t`
        +`<br>Generation: ${d3.format(",.0f")(d['generation'] / 1000)} GWh`)
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    let zoom = d3.zoom()
      .scaleExtent([1, 20])
      .on("zoom", function () {
        mapGroup.attr("transform", d3.event.transform);
        // mapGroup.attr("scale", d3.event.);
        markerGroup.attr("transform", d3.event.transform);
        markerGroup.selectAll("circle")
          .attr("r", d => sizeScale(d['co2emitted']) / d3.event.transform.k)
          .style("stroke-width", function (d) {
            return 1 / d3.event.transform.k; // Adjust stroke width based on zoom scale
          });
      });

    svg.call(zoom);

  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// Tooltip setup
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Call the function to load and render the data
loadData();