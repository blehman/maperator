function set_values(){
  var map_width = window.innerWidth * 0.5
  var map_height = window.innerHeight * 0.8
  var tweet_left_margin = (map_width + 80) + 'px'
  var tweet_top_margin = (-(window.innerHeight * 0.5))+'px'

  d3.select("#tweet")
    .style("margin-left",tweet_left_margin)
    .style("margin-top",tweet_top_margin)

  d3.select('#map')
    .attr('width',map_width)
    .attr('height',map_height)
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
  var toolserver = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png');
  var stamen = L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {attribution: 'Add some attributes here!'}).addTo(map);
  var baseLayers = {"stamen": stamen, "toolserver-mapnik":toolserver};
  L.control.layers(baseLayers).addTo(map);
  return map;
}


d3.json("data/BoulderFlood_viewer.json", function(collection) {
  console.log(["collection:",collection])

  // build map and creat an svg.
  var map = build_map();

  // Initialize map & tweet orientation.
  set_values();

  // For each tweet, add a circle to map.
  var dataArray = d3.entries(collection.time_series.interval_data);
  dataArray.map(function(d){addPoints(d,map)});
  var circles = d3.selectAll(".tweet_location")

  // Adjust map & tweet orientation when window is resized.
  window.addEventListener('resize', function(event){
    set_values();
  });

  // Mouseover event that produces embeded tweet
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

