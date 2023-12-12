d3.json("europe.geojson").then(function (geojson) {
  // Store the loaded GeoJSON data in the variable

  // Load CSV data (assuming it has 'Country' and 'Emissions' columns)
  d3.csv("jrc_countries.csv").then(function (csvData) {
    // Create a map to store emission data by country
    let emissionDataMap = new Map();
    csvData.forEach(function (d) {
      emissionDataMap.set(d['Country'], +d['Emissions']);
    });

    // Merge CSV data with GeoJSON features
    geojson.features.forEach(function (feature) {
      let countryName = feature.properties.NAME; // Adjust this based on your GeoJSON structure
      if (emissionDataMap.has(countryName)) {
        feature.properties.Emissions = emissionDataMap.get(countryName);
      } else {
        feature.properties.Emissions = 0; // Set a default value if no data is available
      }
    });

    const svgWidth = 1000;
    const svgHeight = 1000;
    // Create an SVG container
    let svg = d3.select("#map")
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

    // Use a GeoProjection suitable for your map
    let projection = d3.geoMercator().fitSize([svgWidth, svgHeight], geojson);

    // Create a GeoPath generator
    let geoGenerator = d3.geoPath().projection(projection);

    let mapGroup = svg.append("g");

    let legendGroup = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${svgWidth * 0.02}, ${svgHeight * 0.05})`);

    let colorScale = d3.scaleSequential(d3.interpolateRgbBasis(["#32ba56", "#e3eb0c", "#edbf05", "#f58905", "#f73a00"]))
      .domain(d3.extent(geojson.features, function (d) { return d.properties.Emissions; }));

    // Join the FeatureCollection's features array to path elements
    mapGroup.selectAll('path')
      .data(geojson.features)
      .enter()
      .append('path')
      .attr('d', geoGenerator)
      .style('fill', function (d) {
        if (d.properties.Emissions === 0) {
          return 'grey'; // Set to grey if no data is available
        }
        return colorScale(d.properties.Emissions);
      })
      .style('stroke', 'white');

    // Continuous Color Scale Legend
    let legendGradient = legendGroup.append('defs')
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    legendGradient.selectAll('stop')
      .data(colorScale.ticks(20))
      .enter().append('stop')
      .attr('offset', function (d, i) {
        return i / (colorScale.ticks(20).length - 1);
      })
      .attr('stop-color', function (d) {
        return colorScale(d);
      });

    legendGroup.append('rect')
      .attr('width', 200)
      .attr('height', 20)
      .style('fill', 'url(#legend-gradient)')
      .attr("transform", `translate(${svgWidth * -0.2}, ${svgHeight * 0})`);

    // Add labels for min, and max
    let legendLabels = [colorScale.domain()[0], (colorScale.domain()[1] / 1e6)]

    legendGroup.selectAll('.legend-text')
      .data(legendLabels)
      .enter().append('text')
      .attr('class', 'legend-text')
      .attr('x', function (d, i) {
        if (i == 0) { return svgWidth * -0.2; } else {
          return svgWidth * -0.06;
        }
        // Adjust the spacing based on your needs
      })
      .attr('y', 40) // Adjust the y-position
      .attr('dy', '0.35em')
      .text(function (d) {
        return d3.format(".0f")(d) + " Mt"; // Format as integer and add 'MT' at the end
      });

    // Add legend title
    legendGroup.append('text')
      .attr('class', 'legend-title')
      .attr('x', svgWidth * -0.11) // Adjust the x-position
      .attr('y', svgHeight * -0.01) // Adjust the y-position
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .text('CO2 Emitted per year');

    // Load CSV data (assuming it has 'Lat', 'lon', and '2018' columns)
    d3.csv("jrc_powerplants.csv").then(function (csvData) {
      // Convert Lat, lon, and '2018' to numbers
      csvData.forEach(function (d) {
        d.lat = +d.lat;
        d.lon = +d.lon;
        d['co2emitted'] = +d['co2emitted'];
      });

      // Create a scale for mapping '2018' values to marker size
      let sizeScale = d3.scaleLinear()
        .domain(d3.extent(csvData, function (d) { return d['co2emitted']; }))
        .range([4, 13]); // Adjust the range of marker sizes as needed

      // Custom interpolation between red and blue
      var colorInterpolator = d3.interpolate("#ffff00", "#ff0000");

      // Use a custom interpolator function for color scale
      let colorScale = d3.scaleSequential(colorInterpolator)
        .domain(d3.extent(csvData, function (d) { return d['co2emitted']; }));

      let typeColorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(csvData.map(d => d['type_g']));;

      // Add a group element for the type_g legend
      let typeLegendGroup = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${svgWidth * 1}, ${svgHeight * 0.05})`);

      // Add rectangles with colors for each 'type_g'
      let typeLegendRects = typeLegendGroup.selectAll('.legend-circle')
        .data(typeColorScale.domain())
        .enter().append('circle')
        .attr('class', 'legend-circle')
        .attr('cx', 10)
        .attr('cy', function (d, i) {
          return i * 30 + 10; // Adjust spacing between circles
        })
        .attr('r', 10) // Radius of the circles
        .style('fill', function (d) {
          return typeColorScale(d);
        });

      // Add labels for each 'type_g' in the type_g legend
      typeLegendGroup.selectAll('.legend-text')
        .data(typeColorScale.domain())
        .enter().append('text')
        .attr('class', 'legend-text')
        .attr('y', function (d, i) {
          return i * 30 + 15; // Adjust spacing between labels
        })
        .attr('x', 25)
        .attr('dx', '0.35em')
        .style('text-anchor', 'left')
        .text(function (d) {
          return d;
        });

      // Add a group element to hold the marker elements
      let markerGroup = svg.append("g");

      // Add circles for markers
      markerGroup.selectAll("circle")
        .data(csvData)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
          return projection([d.lon, d.lat])[0];
        })
        .attr("cy", function (d) {
          return projection([d.lon, d.lat])[1];
        })
        .attr("r", function (d) {
          return sizeScale(d['co2emitted']);
        })
        .style("fill", function (d) {
          // Get the RGB color from the color scale
          const rgbColor = d3.color(typeColorScale(d['type_g'])).rgb();
          // Use rgba() notation to set alpha channel (opacity) to 0.5
          return `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.8)`;
        })
        .style("stroke", "blue")
        .style("stroke-width", 1)
        .on("mouseover", function (d) {
          // Show tooltip on mouseover next to the circle
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          tooltip.html(d['name_p'] + "</br>" + "CO2 Emitted: " + d3.format(",")(d['co2emitted'] / 1000) + " t")
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 20) + "px");
        })
        .on("mouseout", function (d) {
          // Hide tooltip on mouseout
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });

      // Add zoom behavior to both map and markers
      let zoom = d3.zoom()
        .scaleExtent([1, 20])
        .on("zoom", function () {
          mapGroup.attr("transform", d3.event.transform);
          markerGroup.attr("transform", d3.event.transform); // Apply zoom to markers
          markerGroup.selectAll("circle")
            .attr("r", function (d) {
              return sizeScale(d['co2emitted']) / d3.event.transform.k; // Adjust radius based on zoom scale
            })
            .style("stroke-width", function (d) {
              return 1 / d3.event.transform.k; // Adjust stroke width based on zoom scale
            });
          // Update the map rendering for better quality during zoom
          mapGroup.selectAll('path')
            .attr('d', geoGenerator);
        });

      svg.call(zoom);
      // Tooltip setup
      let tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    });
  });
}); 