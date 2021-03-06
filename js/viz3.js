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

function addPoints(x,map){
    if (x.value.hasOwnProperty("tweets")){
        x.value.tweets.features.forEach(function(d,i){
            var circle = L.circle([d.geometry.coordinate[1],d.geometry.coordinate[0]], 500, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.2,
                className: "tweet_location_pre_data"
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
/*var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/examples.map-zr0njcqy/{z}/{x}/{y}.png', {
  attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});
*/

//var map = L.map('map')
//.addLayer(mapboxTiles)
//.setView([40.0274,-105.2519], 10);
    var map = L.map('map').setView([40.0274,-105.2519], 10);
    var stamen = L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {attribution: 'dev.'}).addTo(map);
    var toolserver = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png');
    //var baseLayers = {"stamen": stamen, "toolserver-mapnik":toolserver};
    var baseLayers = {"stamen": stamen, "toolserver-mapnik":toolserver};
    L.control.layers(baseLayers).addTo(map);
    return map;
}

function create_timeline_data(dataArray){
    var data = {};
    dataArray.forEach(function(d,i){
      // d.key = date
      // d.value.tweets.featurs = ARRAY
      // ARRAY.properties = {body,link,tweet,user_id}
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

    var margin = {top: windowHeight*0.1, right: 0, bottom: windowHeight*0.1, left: 50},
        width = mapWidth,
        height =  windowHeight*0.3 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(Math.max(width/200,2))
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
      svg.append("path")
          .datum(data)
          .attr("class", "line")
          .attr("d", line);

}
function add_fore_directed(data){

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        padding = 1, // separation between nodes
        radius = 6;

    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.category10();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var controls = d3.select("body").append("label")
        .attr("id", "controls");
    var checkbox = controls.append("input")
        .attr("id", "collisiondetection")
        .attr("type", "checkbox");
    controls.append("span")
        .text("Collision detection");

    var force = d3.layout.force()
        .nodes(data)
        .size([width, height])
        .on("tick", tick)
        .charge(-1)
        .gravity(0)
        .chargeDistance(20);
}

d3.json("data/BoulderFlood_viewer.json", function(collection) {
  console.log(["collection:",collection])

// Enventuall: render photos
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
/*
  var svg = d3.select(map.getPanes().overlayPane).append("svg");
  var startDate = collection.time_series.metadata.time_start;
  var endDate = collection.time_series.metadata.time_end;
  var interval = collection.time_series.metadata.interval_minutes;
*/
/*  var tester = L.circle([40.0274,-105.2519], 500, {
                color: 'yellow',
                fillColor: '#f03',
                fillOpacity: 0.2,
                className: "practice_point"
            }).addTo(map);
*/


});

