var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/examples.map-zr0njcqy/{z}/{x}/{y}.png', {
  attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});

var map = L.map('map')
.addLayer(mapboxTiles)
.setView([40.0274,-105.2519], 10);

function addPoints(svg,x){
    //console.log()
  
    if (x.value.hasOwnProperty("tweets")){
        //console.log(x.value.tweets)
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
        //console.log(["x.value.tweets: ",x.value.tweets.features])
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

/*  var tester = L.circle([40.0274,-105.2519], 500, {
                color: 'yellow',
                fillColor: '#f03',
                fillOpacity: 0.2,
                className: "practice_point"
            }).addTo(map);
*/

  circles = d3.selectAll(".tweet_location")
  circles.on("mouseover",function(event){
      d3.select("#tweet").selectAll("*").remove();
      twttr.widgets.createTweet(
          d3.select(this).attr('tweet').split('/')[5],
          document.getElementById('tweet'))
      d3.select("#tweet")
        .style("margin-left","850px")
        .style("margin-top","-425px")
  });

 });

