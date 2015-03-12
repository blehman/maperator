var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/examples.map-zr0njcqy/{z}/{x}/{y}.png', {
  attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});

var map = L.map('map')
.addLayer(mapboxTiles)
.setView([40.0274,-105.2519], 13);

function addPoints(svg,x){
    //console.log()
  
    if (x.value.hasOwnProperty("tweets")){
        console.log(x.value.tweets.features)
        x.value.tweets.features.forEach(function(d){
            var circle = L.circle([d.geometry.coordinate[1],d.geometry.coordinate[0]], 500, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.2,
                className: "tweet_location"
            }).addTo(map);
        })
        console.log(["x.value.tweets: ",x.value.tweets.features])
    };
}

d3.json("data/BoulderFlood_viewer.json", function(collection) {
  console.log(["collection:",collection])

  var svg = d3.select(map.getPanes().overlayPane).append("svg");
  //var g = svg.append("g").attr("class", "container_with_points");

  var startDate = collection.time_series.metadata.time_start;
  var endDate = collection.time_series.metadata.time_end;
  var interval = collection.time_series.metadata.interval_minutes;

  dataArray = d3.entries(collection.time_series.interval_data);

  dataArray.map(function(d){addPoints(svg,d)});
  d3.select("#map").attr("transform","translate( 400 , 100)")
  

  /*
     var featuresdata = collection.features.filter(function(d) {
     return d.properties.id == "route1"
     });

     var originANDdestination = [featuresdata[0], featuresdata[17]]()

     var ptFeatures = g.selectAll("circle")
     .data(featuresdata)
     .enter()
     .append("circle")
     .attr("r", 3)
     .attr("class", "waypoints");
     */
});

