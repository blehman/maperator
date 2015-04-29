function set_values(timelineData,dateParsed){
    // adjusts the location of elements and timeline

    var mapWidth = window.innerWidth * 0.5
    var mapHeight = window.innerHeight * 0.8
    var tweetLeftMargin = (mapWidth + 80) + 'px'
    var tweetTopMargin = (-(window.innerHeight)+33)+'px'

    d3.select('#photo')
      .style("margin-left",tweetLeftMargin)
      .style("margin-top",tweetTopMargin+80);

    d3.select("#tweet")
      .style("margin-left",tweetLeftMargin)
      .style("margin-top",tweetTopMargin);

    d3.select('#map')
      .attr('width',mapWidth)
      .attr('height',mapHeight);

    // Create timeline
    create_timeline(timelineData,mapWidth,dateParsed);

}

function create_random_values(){
    // used to jitter points

    var num = 0.05
    return [getRandomArbitrary(-num,num),getRandomArbitrary(-num,num)]
}
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function addPoints(x,map){
    // adds geo as circles to map

    var rand = create_random_values();
    var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
    var dateParsed = parseDate(x.key);

    // dateTag is used to class each tweet in a time bucket - currently hardcoded for the hourly bucket
    var dateTag = dateParsed.toString().split(':')[0].replace(/ /g,'_');

    if (x.value.hasOwnProperty("tweets")){
        // checks to see if the times series contains tweet data and then uses geo to create circle on map
        x.value.tweets.features.forEach(function(d,i){
            var circle = L.circle([parseFloat(d.geometry.coordinate[1])+rand[0],parseFloat(d.geometry.coordinate[0])+rand[1]],200, {
                color: 'steelblue',
                fillColor: 'steelblue',
                fillOpacity: 0.2,
                className: "tweet_location_pre_data",
                radius: 1
            }).addTo(map);

            // adds data to each circle
            var circleData = d3.selectAll(".tweet_location_pre_data")
                .classed("tweet_location_pre_data",false)
                .classed("tweet_location " + dateTag,true)
                .attr("id","tweetID_"+d.properties.tweet.split('/')[5])
                .attr("media",d.properties.link)
                .attr("tweet",d.properties.tweet)
                .attr("user",d.properties.user_id)
                .attr("date",dateParsed);
        })
    };
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
    var windowHeight = window.innerHeight;

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

    // transform date string into date object
    data.forEach(function(d) {
      if (!dateParsed){
          d.key = parseDate(d.key);
      }
      d.value = +d.value;
    });

    // add range to scales
    x.domain(d3.extent(data, function(d) { return d.key; }));
    y.domain(d3.extent(data, function(d) { return d.value; }));

    // create x axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // append the circle at the intersection
    var focus = svg.append("g")
        .style("display", "none");

    // create conditional y axis
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

    // create timeline line
    svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line);

    // append the circle at the intersection
    focus.append("circle")
      .attr("class", "y")
      .style("fill", "none")
      .style("stroke", "steelblue")
      .style("stroke-width",2)
      .attr("r", 4);

    // append moving red circle to timeline at the intersection
    focus.append("circle")
      .attr("class", "y")
      .style("fill", "none")
      .style("stroke", "steelblue")
      .style("stroke-width",2)
      .attr("r", 8)

    // append the rectangle to capture mouse
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", function() { focus.style("display", null); })
      .on("mouseout", function() { focus.style("display", "none"); })
      .on("mousemove", mousemove);

    function mousemove() {
        // x0 is the x-coordinate associated with the mouse location on the timeline
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.key > d1.key - x0 ? d1 : d0;

        // dateTag needs to be reconsidered - the split hardcodes hourly buckets
        var dateTag = (x0.toString()).split(':')[0].replace(/ /g,'_')

        // color circles on map w/ corresponding date
        d3.selectAll('.'+dateTag)
            .style("fill","red")
            .style("fill-opacity",1)
            .style("stroke","red")
            .style("stroke-opacity",1)
            .transition()
              .duration(2000)
              .delay(0)
              .style("fill","steelblue")
              .style("fill-opacity",0.2)
              .style("stroke","steelblue")
              .style("stroke-opacity",0.5)

        // create red circles on timeline
        focus.append("circle")
          .attr("class","remover")
          .attr("cx",x(d.key))
          .attr("cy",y(d.value))
          .attr("fill","red")
          .style("fill-opacity",0.1)
          .attr("r",8)
          .transition()
            .duration(1000)
            .delay(0)
            .remove()

        // move the circles at intersection of mouse w/ timeline x-axis
        focus.selectAll("circle.y")
            .attr("transform",
                  "translate(" + x(d.key) + "," + y(d.value) + ")");
    }
}







































function build_map(){
    // uses leaflet.js to build a zoomable map

    var map = L.map('map').setView([40.0274,-105.2519],13);
    var stamen = L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {attribution: 'dev.'}).addTo(map);
    var toolserver = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png');
    var baseLayers = {"stamen": stamen, "toolserver-mapnik":toolserver};
    L.control.layers(baseLayers).addTo(map);
    return map;
}

function set_sizes(){

    // keep all window sizes in scope
    var windowHeight = +window.innerHeight;
    var windowWidth = +window.innerWidth;

    // map sizes
    var margin = {top: windowHeight*0.01, right: 0, bottom: windowHeight*0.1, left: windowWidth*0.10};

    var sizes = {
            mapWidth: "40%"
            , mapHeight: "50%"
            , timelineWidth: windowWidth * 0.37
            , timelineHeight: windowHeight * 0.2
            , timelineMarginLeft: (windowWidth * 0.02)+35
            , timelineMarginTop: (windowHeight * 0.5)+ (windowHeight * 0.1)
            , width: windowWidth * 0.8
            , height: windowHeight*0.3 - margin.top - margin.bottom
            , tweetTopMargin: margin.top
            , margin: margin
            , windowHeight: windowHeight
            , windowWidth: windowWidth
      };

    d3.select('#map')
      .style('width',sizes.mapWidth)
      .style('height',sizes.mapHeight);

    d3.select('#timeline')
      .style('width',sizes.windowWidth)
      .style('height',sizes.windowHeight);

    //d3.select('.volume')
    //  .style('width',sizes.timelineWidth)
    //  .attr("transform", "translate(" + sizes.windowWidth * 0.05 + "," +150+ ")");
    var scales = update_scales(sizes);
    return sizes;
}

function update_scales(sizes){
    // function to create x scale
    var x = d3.time.scale()
        .range([0, sizes.timelineWidth]);

    // function to create y scale
    var y = d3.scale.linear()
        .range([sizes.timelineHeight, 0]);

    // https://github.com/mbostock/d3/wiki/Time-Formatting
    // function to build xAxis options
    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(Math.max(sizes.timelineWidth/200,2))
        .tickFormat(d3.time.format("%b %d"))
        .orient("bottom");

    // function to build yAxis options
    var yAxis = d3.svg.axis()
        .scale(y)
        .ticks(Math.max(sizes.timelineHeight/50,2))
        .orient("left");

    return {x:x, y:y, xAxis:xAxis, yAxis:yAxis}

}

function create_timeline2(data, sizes){
    d3.select(".volume").remove();

    // get scales
    var scales = update_scales(sizes);

    var x = scales.x
      , y = scales.y
      , xAxis = scales.xAxis
      , yAxis = scales.yAxis;

    // function to draw a line given across coordinates (x,y).
    var line = d3.svg.line()
        .x(function(d) { return x(d.key); })
        .y(function(d) { return y(d.value); });

    // create a container inside a pre-existing "id=timeline" element.
    var svg = d3.select("#timeline")
        .classed("timeline",true)
        .attr("width", sizes.windowWidth)
        .attr("height", sizes.windowHeight)
      .append("g")
        .classed("volume",true)
        .attr("transform", "translate(" + (sizes.timelineMarginLeft) + "," + (sizes.timelineMarginTop) + ")");

    // add domain to scales
    x.domain(d3.extent(data, function(d) { return d.key; }));
    y.domain(d3.extent(data, function(d) { return d.value; }));

    // create line
    svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line);

    // create x axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + sizes.timelineHeight+ ")")
        .call(xAxis);

    // create conditional y axis
    if (sizes.windowHeight > 600){
      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Tweets");
    };

}

function add_features_to_map(timeStamp,features,map){

    // add features to the map
    features.forEach(function(feature,i){
        //var feature["timeStamp"] = timeStamp;
        //var feature["timeStamp_str"] = timeStamp.toString();

        // add points to map try to do this directly w/ geoJson
        L.geoJson(feature).addTo(map);
    });
}


function convert_to_array(data,map){

    // to iterate, we transform the object to array 
    var dataArray = d3.entries(data.time_series.interval_data);

    // function for parsing dates
    var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

    // parse dates and coerce values
    function iterate_(dataArray){
        parsedDataArray = [];
        dataArray.forEach(function(ts) {
            add_features_to_map(ts.key,ts.value.tweets_geo.features,map);

            // create timeline data
            parsedDataArray.push({
              key:parseDate(ts.key)
              , value:+ts.value.stats.tweets_geo_all
            });
        });
        return parsedDataArray.sort(function(a,b){
            return b.key-a.key
        });
    }
    return iterate_(dataArray);
}


//d3.json("data/BoulderFlood_viewer.json", function(collection) {
d3.json("data/event_viewer.json", function(collection) {
    console.log(["collection:",collection])

    // all sizes
    var sizes = set_sizes();

    // build map and creat an svg.
    var map = build_map();

    // build timeline
    var timelineData = convert_to_array(collection,map);
    console.log(timelineData);
    create_timeline2(timelineData,sizes);


    // add point to map
    

  // Transform object to array
  
  //var dataArray = d3.entries(collection.time_series.interval_data);
  //var timelineData = create_timeline_data(dataArray)

  // insure that once the date strings become date objects, they do not get parsed again.
  //var dateParsed = false;

  // Initialize map & tweet orientation.
  //set_values(timelineData,dateParsed);

  // For each tweet, add a circle to map.
  //dataArray.map(function(d){addPoints(d,map)});

  // Adjust map & tweet orientation when window is resized.
  window.addEventListener('resize', function(event){
      //var dateParsed = true
      //set_values(timelineData,dateParsed);
      var sizes = set_sizes();
      create_timeline2(timelineData,sizes);
  });

  // Mouseover event that produces embeded tweet
  var circles = d3.selectAll(".tweet_location")

  circles.on("mouseover",function(event){

      // removes old embeded tweet
      var element = d3.select(this)
      d3.select("#tweet").selectAll("*").remove();

      // adds new embeded tweet
      twttr.widgets.createTweet(
          element.attr('tweet').split('/')[5],
          document.getElementById('tweet')
      );

      if (element.attr("media").match("instagram.com") != null){
          // embeds instagram photo
          d3.select('#photo').attr('src','http://instagram.com/p/' + element.attr("media").split('/')[4] +'/media/?size=l');
      }
  });
});

