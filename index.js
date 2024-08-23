// URLs for the education and county data
const EDUCATION_FILE = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
const COUNTY_FILE = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

// Dimensions
const WIDTH = 960;
const HEIGHT = 600;
const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };

// Create SVG
const svg = d3.select('#map')
  .append('svg')
  .attr('width', WIDTH)
  .attr('height', HEIGHT);

// Create tooltip
const tooltip = d3.select('#tooltip')
  .style('opacity', 0)
  .style('position', 'absolute')
  .style('background-color', 'white')
  .style('border', 'solid')
  .style('border-width', '1px')
  .style('border-radius', '5px')
  .style('padding', '5px');

// Load data
Promise.all([
  d3.json(COUNTY_FILE),
  d3.json(EDUCATION_FILE)
]).then(([countyData, educationData]) => {
  // Create map
  const path = d3.geoPath();

  // Create color scale
  const educationExtent = d3.extent(educationData, d => d.bachelorsOrHigher);
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain(educationExtent);

  // Draw counties
  svg.append('g')
    .selectAll('path')
    .data(topojson.feature(countyData, countyData.objects.counties).features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('class', 'county')
    .attr('data-fips', d => d.id)
    .attr('data-education', d => {
      const result = educationData.find(item => item.fips === d.id);
      return result ? result.bachelorsOrHigher : 0;
    })
    .attr('fill', d => {
      const result = educationData.find(item => item.fips === d.id);
      return result ? colorScale(result.bachelorsOrHigher) : 'gray';
    })
    .on('mouseover', (event, d) => {
        const result = educationData.find(item => item.fips === d.id);
        if (result) {
          tooltip.style('opacity', 0.9)
            .html(`${result.area_name}, ${result.state}: ${result.bachelorsOrHigher}%`)
            .attr('data-education', result.bachelorsOrHigher)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        }
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      });

  // Draw state borders
  svg.append('path')
    .datum(topojson.mesh(countyData, countyData.objects.states, (a, b) => a !== b))
    .attr('class', 'state')
    .attr('d', path);

  // Create legend
  const legendWidth = 300;
  const legendHeight = 20;
  const legendData = colorScale.ticks(8);

  const legend = svg.append('g')
    .attr('id', 'legend')
    .attr('transform', `translate(${WIDTH - MARGIN.right - legendWidth}, ${MARGIN.top - 20})`)

  legend.selectAll('rect')
    .data(legendData)
    .enter()
    .append('rect')
    .attr('x', (d, i) => i * (legendWidth / legendData.length))
    .attr('width', legendWidth / legendData.length)
    .attr('height', legendHeight)
    .style('fill', d => colorScale(d));

  legend.selectAll('text')
    .data(legendData)
    .enter()
    .append('text')
    .attr('x', (d, i) => i * (legendWidth / legendData.length))
    .attr('y', legendHeight + 15)
    .text(d => Math.round(d) + '%')
    .style('font-size', '10px');

}).catch(error => console.log('Error loading data:', error));