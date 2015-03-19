function set_values(timelineData,dateParsed){
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
    var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
    var dateParsed = parseDate(x.key);
    var dateTag = dateParsed.toString().split(':')[0].replace(/ /g,'_');

    if (x.value.hasOwnProperty("tweets")){
        x.value.tweets.features.forEach(function(d,i){
            var circle = L.circle([parseFloat(d.geometry.coordinate[1])+rand[0],parseFloat(d.geometry.coordinate[0])+rand[1]],200, {
                color: 'steelblue',
                fillColor: 'steelblue',
                fillOpacity: 0.2,
                className: "tweet_location_pre_data",
                radius: 1
            }).addTo(map);

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

    function mousemove() {                                 // **********
        var x0 = x.invert(d3.mouse(this)[0]),              // **********
            i = bisectDate(data, x0, 1),                   // **********
            d0 = data[i - 1],                              // **********
            d1 = data[i],                                  // **********
            d = x0 - d0.key > d1.key - x0 ? d1 : d0;     // **********
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

        // move the circles at intersection
        focus.selectAll("circle.y")
            .attr("transform",
                  "translate(" + x(d.key) + "," + y(d.value) + ")");
    }
}

// d3.jsonp code from https://github.com/d3/d3-plugins/tree/master/jsonp

d3.jsonp = function (url, callback) {
  function rand() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      c = '', i = -1;
    while (++i < 15) c += chars.charAt(Math.floor(Math.random() * 52));
    return c;
  }

  function create(url) {
    var e = url.match(/callback=d3.jsonp.(\w+)/),
      c = e ? e[1] : rand();
    d3.jsonp[c] = function(data) {
      callback(data);
      delete d3.jsonp[c];
      script.remove();
    };
    return 'd3.jsonp.' + c;
  }

  var cb = create(url),
    script = d3.select('head')
    .append('script')
    .attr('type', 'text/javascript')
    .attr('src', url.replace(/(\{|%7B)callback(\}|%7D)/, cb));
};

function fuckJsonP(instaG) {
       d3.select('.photo').remove();

       d3.select("body")
          .append('div')
            .classed('photo',true)
            .html(instaG.html);
};


d3.json("data/BoulderFlood_viewer.json", function(collection) {
  console.log(["collection:",collection])

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
      var element = d3.select(this)
      d3.select("#tweet").selectAll("*").remove();

      twttr.widgets.createTweet(
          element.attr('tweet').split('/')[5],
          document.getElementById('tweet')
      );

      if (element.attr("media").match("instagram.com") != null){
          d3.select('#photo').attr('src','http://instagram.com/p/' + element.attr("media").split('/')[4] +'/media/?size=l');
          console.log(element.attr("media").split('/')[4])
          //d3.jsonp("http://api.instagram.com/oembed?OMITSCRIPT=true&HIDECAPTION=true&url="+element.attr("media")+"&callback=fuckJsonP");
      }
  });
});

