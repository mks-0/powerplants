async function loadData() {
  try {
    const [geojson, countryData, powerplantsData] = await Promise.all([
      d3.json("Data/europe.geojson"),
      d3.csv("Data/ember_countries.csv"),
      d3.csv("Data/jrc_powerplants.csv")
    ]);

    powerplantsData.forEach(d => {
      d.lat = +d.lat;
      d.lon = +d.lon;
      d['co2emitted'] = +d['co2emitted'];
    });

    let currentDataProperty = 'Emissions';

    // Process country emissions data
    const emissionDataMap = new Map(countryData.map(d => [d['Country'], +d['Emissions']]));

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
    const mapColorScale = d3.scaleSequential(d3.interpolateRgbBasis([
      "#f5e267", "#f77d31", "#c72a12"
    ]))
      .domain(d3.extent(geojson.features, d => d.properties.Emissions));

    // Join the FeatureCollection's features array to path elements
    mapGroup.selectAll('path')
      .data(geojson.features)
      .enter()
      .append('path')
      .attr('d', geoGenerator)
      .style('fill', d => (d.properties.Emissions === 0) ? '#ababab' : mapColorScale(d.properties.Emissions))
      .style('stroke', 'white');

    // Continuous Color Scale Legend
    const legendGroup = d3.select('#map').append("g")
      .attr("class", "legend")
      .attr("id", "em-legend")

    const legendGradient = legendGroup.append('defs')
      .append('linearGradient')
      .attr('id', 'em-legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    legendGradient.selectAll('stop')
      .data(mapColorScale.ticks(20))
      .enter().append('stop')
      .attr('offset', (d, i) => i / (mapColorScale.ticks(20).length))
      .attr('stop-color', d => mapColorScale(d));

    legendGroup.append('rect')
      .attr('width', 210)
      .attr('height', 25)
      .style('fill', 'url(#em-legend-gradient)')

    const legendLabels = [mapColorScale.domain()[0], (mapColorScale.domain()[1] / 1e6)];

    legendGroup.selectAll('.em-legend-text')
      .data(legendLabels)
      .enter().append('text')
      .attr('id', 'em-legend-text')
      .attr('x', (d, i) => (i == 0) ? 0 : 150)
 
      .text(d => d3.format(".0f")(d) + " Mt");

    legendGroup.append('text')
      .attr('id', 'em-legend-title')
      .text('CO2 Emissions sum');

    function switchEmissions() {
      let dataPropertyMap = new Map(countryData.map(d => [d['Country'], +d[currentDataProperty]]));

      geojson.features.forEach(feature => {
        let countryName = feature.properties.NAME;
        feature.properties[currentDataProperty] = dataPropertyMap.has(countryName) ? dataPropertyMap.get(countryName) : 0;
      });

      // Update color scale domain
      mapColorScale.domain(d3.extent(geojson.features, d => d.properties[currentDataProperty]));

      // Update map fill
      mapGroup.selectAll('path')
        .style('fill', d => (d.properties[currentDataProperty] === 0) ? '#ababab' : mapColorScale(d.properties[currentDataProperty]));

      // Dynamically generate legend title and labels
      let isEmissions = currentDataProperty === 'Emissions';
      let titleText = isEmissions ? 'CO2 Emissions sum' : 'CO2 Emissions per capita';
      let legendLabels = isEmissions ? [mapColorScale.domain()[0], mapColorScale.domain()[1] / 1e6] : [mapColorScale.domain()[0], mapColorScale.domain()[1] * 1000];

      // Update legend title and labels
      legendGroup.select('#em-legend-title')
        .text(titleText)

      legendGroup.selectAll('#em-legend-text')
        .data(legendLabels)
        .text(d => d3.format(isEmissions ? ".0f" : ",.0f")(d) + (isEmissions ? " Mt" : " Kg"));
    }

    // Add an event listener or UI element to trigger the switch
    d3.select('#switchButton') // Change this selector based on your UI element
      .on('click', function () {
        // Toggle between 'Emissions' and 'em_per_capita'
        currentDataProperty = (currentDataProperty === 'Emissions') ? 'em_per_capita' : 'Emissions';
        // Update map and legend with the new data property
        switchEmissions();
      });

    // Powerplants data processing
    const sizeScale = d3.scaleLinear()
      .domain(d3.extent(powerplantsData, d => d['co2emitted']))
      .range([4, 13]);

    const typeColorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(powerplantsData.map(d => d['type_g']));

    // Add a group element for the type_g legend
    const typeLegendGroup = d3.select('#map').append("g")
      .attr("class", "legend")
      .attr("id", "type-legend")

    typeLegendGroup.selectAll('.legend-circle')
      .data(typeColorScale.domain())
      .enter().append('circle')
      .attr('id', 'type-legend-circle')
      .attr('cx', 10)
      .attr('cy', (d, i) => i * 30 + 10)
      .attr('r', 10)
      .style('fill', d => typeColorScale(d));

    typeLegendGroup.selectAll('.legend-text')
      .data(typeColorScale.domain())
      .enter().append('text')
      .attr('id', 'type-legend-text')
      .attr('y', (d, i) => i * 30 + 15)
      .attr('x', 25)
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
        return `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.9)`;
      })
      .style("stroke", "blue")
      .style("stroke-width", 1)
      .on("mouseover", function (d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`${d['country']}<br>Name: ${d['name_p']}<br>`
          + `CO2 Emitted: ${d3.format(",.0f")(d['co2emitted'] / 1000)} t`
          + `<br>Generation: ${d3.format(",.0f")(d['generation'] / 1000)} GWh`)
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    const initialZoom = {
      k: 1.7,  // Initial scale (adjust as needed)
      x: -500,  // Initial x translation
      y: -700   // Initial y translation
    };

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

    // Apply the initial zoom settings
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(initialZoom.x, initialZoom.y)
      .scale(initialZoom.k)
    );

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