function set_values(timelineData,dateParsed){
  var mapWidth = window.innerWidth * 0.5
  var mapHeight = window.innerHeight * 0.8
  var tweetLeftMargin = (mapWidth + 80) + 'px'
  var tweetTopMargin = (-(window.innerHeight)+33)+'px'

  d3.select("#tweet")
    .style("margin-left",tweetLeftMargin)
    .style("margin-top",tweetTopMargin)

  d3.select('#map')
    .attr('width',mapWidth)
    .attr('height',mapHeight)

  // Create timeline
  //console.log(["create_timeline",create_timeline]);
  create_timeline(timelineData,mapWidth,dateParsed);

}

function create_random_values(){
    var num = 0.05
    return [getRandomArbitrary(-num,num),getRandomArbitrary(-num,num)]
}
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function addPoints(x,map){

    var rand = create_random_values()
    if (x.value.hasOwnProperty("tweets")){
        x.value.tweets.features.forEach(function(d,i){
            var circle = L.circle([parseFloat(d.geometry.coordinate[1])+rand[0],parseFloat(d.geometry.coordinate[0])+rand[1]],300, {
                color: 'steelblue',
                fillColor: 'steelblue',
                fillOpacity: 0.2,
                className: "tweet_location_pre_data",
                radius: 10
            }).addTo(map);

            var circleData = d3.selectAll(".tweet_location_pre_data")
                .classed("tweet_location_pre_data",false)
                .classed("tweet_location",true)
                .attr("id","tweetID_"+d.properties.tweet.split('/')[5])
                .attr("media",d.properties.link)
                .attr("tweet",d.properties.tweet)
                .attr("user",d.properties.user_id);
        })
    };
}


function build_map(){
    var map = L.map('map').setView([40.0274,-105.2519],13);
    var stamen = L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {attribution: 'dev.'}).addTo(map);
    var toolserver = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png');
    var baseLayers = {"stamen": stamen, "toolserver-mapnik":toolserver};
    L.control.layers(baseLayers).addTo(map);
    return map;
}

function create_timeline_data(dataArray){
    var data = {};
    dataArray.forEach(function(d,i){
        if (d.value.hasOwnProperty("tweets")){
            data[d.key] = d.value.tweets.features.length
        }else{
            data[d.key] = 0
        }
    })
    return d3.entries(data)
}

function create_timeline(data,mapWidth,dateParsed){
    // remove old timeline
    d3.select("#timeline").selectAll("*").remove();
    var windowHeight = window.innerHeight

    var bisectDate = d3.bisector(function(d) { return d.key; }).left;

    var margin = {top: windowHeight*0.1, right: 0, bottom: windowHeight*0.1, left: 50},
        width = mapWidth,
        height =  windowHeight*0.3 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    // https://github.com/mbostock/d3/wiki/Time-Formatting
    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(Math.max(width/200,2))
        .tickFormat(d3.time.format("%b %d"))
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .ticks(Math.max(height/50,2))
        .orient("left");

    var line = d3.svg.line()
        .x(function(d) { return x(d.key); })
        .y(function(d) { return y(d.value); });

    var svg = d3.select("#timeline")
        .classed("timeline",true)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    data.forEach(function(d) {
      if (!dateParsed){
          d.key = parseDate(d.key);
      }
      d.value = +d.value;
    });
    x.domain(d3.extent(data, function(d) { return d.key; }));
    y.domain(d3.extent(data, function(d) { return d.value; }));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    var focus = svg.append("g")
        .style("display", "none");

    if (windowHeight > 600){
      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Tweets");
    };

    // 
    svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line);

    // append the circle at the intersection 
    focus.append("circle")
      .attr("class", "y")
      .style("fill", "none")
      .style("stroke", "blue")
      .attr("r", 4);

    // append the rectangle to capture mouse
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", function() { focus.style("display", null); })
      .on("mouseout", function() { focus.style("display", "none"); })
      .on("mousemove", mousemove);

    function mousemove() {                                 // **********
        var x0 = x.invert(d3.mouse(this)[0]),              // **********
            i = bisectDate(data, x0, 1),                   // **********
            d0 = data[i - 1],                              // **********
            d1 = data[i],                                  // **********
            d = x0 - d0.key > d1.key - x0 ? d1 : d0;     // **********

        focus.select("circle.y")                           // **********
            .attr("transform",                             // **********
                  "translate(" + x(d.key) + "," +         // **********
                                 y(d.value) + ")");        // **********
    }                                                      // **********
}

d3.json("data/BoulderFlood_viewer.json", function(collection) {
  console.log(["collection:",collection])

// Enventually: render photos
/*  d3.json("http://api.instagram.com/oembed?url=http://instagr.am/p/fA9uwTtkSN/",function(error, json) {
    if (error) return console.warn(error);
    data = json;
    console.log(data)
  });
*/
  // build map and creat an svg.
  var map = build_map();

  // Transform object to array
  var dataArray = d3.entries(collection.time_series.interval_data);
  var timelineData = create_timeline_data(dataArray)
  var dateParsed = false
  // Initialize map & tweet orientation.
  set_values(timelineData,dateParsed);

  // For each tweet, add a circle to map.
  dataArray.map(function(d){addPoints(d,map)});

  // Adjust map & tweet orientation when window is resized.
  window.addEventListener('resize', function(event){
      var dateParsed = true
      set_values(timelineData,dateParsed);
  });

  // Mouseover event that produces embeded tweet
  var circles = d3.selectAll(".tweet_location")

  circles.on("mouseover",function(event){
      d3.select("#tweet").selectAll("*").remove();
      twttr.widgets.createTweet(
          d3.select(this).attr('tweet').split('/')[5],
          document.getElementById('tweet'))
  });
});

