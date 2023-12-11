d3.json("europe.geojson").then(function (geojson) {
  // Store the loaded GeoJSON data in the variable

  // Create an SVG container
  let svg = d3.select("#map-container");

  // Use a GeoProjection suitable for your map
  let projection = d3.geoMercator().fitSize([1920, 1080], geojson);

  // Create a GeoPath generator
  let geoGenerator = d3.geoPath().projection(projection);

  let mapGroup = svg.append("g");

  // Join the FeatureCollection's features array to path elements
  mapGroup.selectAll('path')
    .data(geojson.features)
    .enter()
    .append('path')
    .attr('d', geoGenerator)
    .style('fill', 'lightgrey')
    .style('stroke', 'white');

  // Load CSV data (assuming it has 'Lat', 'Long', and '2018' columns)
  d3.csv("Ember_power_plant_emitters_ets.csv").then(function (csvData) {
    // Convert Lat, Long, and '2018' to numbers
    csvData.forEach(function (d) {
      d.Lat = +d.Lat;
      d.Long = +d.Long;
      d['2018'] = +d['2018'];
    });

    // Create a scale for mapping '2018' values to marker size
    let sizeScale = d3.scaleLinear()
      .domain(d3.extent(csvData, function (d) { return d['2018']; }))
      .range([4, 13]); // Adjust the range of marker sizes as needed

    // Custom interpolation between red and blue
    var colorInterpolator = d3.interpolate("#ffff00", "#ff0000");

    // Create a scale for mapping '2018' values to marker color
    // Use a custom interpolator function for color scale
    let colorScale = d3.scaleSequential(colorInterpolator)
      .domain(d3.extent(csvData, function (d) { return d['2018']; }));

    // Add a group element to hold the marker elements
    let markerGroup = svg.append("g");
    // Add circles for markers
    markerGroup.selectAll("circle")
      .data(csvData)
      .enter()
      .append("circle")
      .attr("cx", function (d) {
        return projection([d.Long, d.Lat])[0];
      })
      .attr("cy", function (d) {
        return projection([d.Long, d.Lat])[1];
      })
      .attr("r", function (d) {
        return sizeScale(d['2018']);
      })
      .style("fill", function (d) {
        return colorScale(d['2018']);
      })
      .style("stroke", "blue")
      .style("stroke-width", 1)
      .on("mouseover", function (d) {
        // Show tooltip on mouseover next to the circle
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html("Value: " + d['2018'])
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
      .scaleExtent([1, 8])
      .on("zoom", function () {
        mapGroup.attr("transform", d3.event.transform);
        markerGroup.attr("transform", d3.event.transform); // Apply zoom to markers
        markerGroup.selectAll("circle")
          .attr("r", function (d) {
            return sizeScale(d['2018']) / d3.event.transform.k; // Adjust radius based on zoom scale
          })
          .style("stroke-width", function (d) {
            return 1 / d3.event.transform.k; // Adjust stroke width based on zoom scale
          });
      });

    svg.call(zoom);
    // Tooltip setup
    let tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  });
});