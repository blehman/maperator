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
    console.log('setting sizes')

    // keep all window sizes in scope
    var windowHeight = +window.innerHeight;
    var windowWidth = +window.innerWidth;

    // map sizes
    var margin = {top: windowHeight*0.01, right: 0, bottom: windowHeight*0.1, left: windowWidth*0.10};

    var sizes = {
            mapWidth: (0.40 * windowWidth)
            , mapHeight: (0.40 * windowHeight)
            , mapLeft: d3.min([(0.02 * windowWidth),20])
            , mapTop: d3.min([(0.05 * windowHeight),30])
            , timelineWidth: 0.36 * windowWidth
            , timelineHeight: 0.20 * windowHeight
            , timelineMarginLeft: (windowWidth * 0.02)+35
            , photoHeight: 0.40 * windowHeight
            , windowHeight: windowHeight
            , windowWidth: windowWidth
    }
    sizes["timelineMarginTop"] = (sizes.mapHeight)+ d3.min([(sizes.windowHeight * 0.10),60]);
    sizes["tweetMarginLeft"] = ( sizes.mapWidth + sizes.mapLeft + d3.min([sizes.windowWidth*0.1,20]));
    sizes["photoMarginLeft"] = sizes.tweetMarginLeft;
    sizes["tweetTop"] = sizes.mapTop;

    // ISSUE: need to determine how to get the highe of the tweet
    if (d3.select("#tweet iframe")[0][0] == null){
        var tweetWidgetHeight = 0;
    }else{
        var tweetWidgetHeight = +d3.select("#tweet iframe")[0][0].height;
    }

    // ISSUE: remove the 155 and replace with `tweetWidgetHeight` once the tweet height is determined.
    sizes["photoTop"] = sizes.tweetTop + 155  + d3.min([sizes.windowWidth*0.1,20]);

    // adjust map
    d3.select('#map')
      .style('left',sizes.mapLeft + 'px')
      .style('top',sizes.mapTop + 'px')
      .style('width',sizes.mapWidth + 'px')
      .style('height',sizes.mapHeight + 'px');

    // adjust timeline svg
    d3.select(".timeline")
      .attr("width", sizes.windowWidth)
      .attr("height", sizes.windowHeight)

    // adjust timeline volume plot
    d3.select('.volume')
      .style('height',sizes.timelineHeight)
      .attr("transform", "translate(" + (sizes.timelineMarginLeft) + "," + (sizes.timelineMarginTop) + ")");

    // adjust tweet
    d3.select('#tweet')
      .style('margin-left',sizes.tweetMarginLeft + 'px')
      .style('top',sizes.tweetTop+'px');

    // adjust tweet list
    d3.select('#tweets')
      .style('margin-left',sizes.tweetMarginLeft + 'px')
      .style('height',"800px")
      .style('overflow',"auto")
      .style('width',"520px")
      .style('top','-520px');

    // adjust photo
    d3.select('#photo')
      .style('margin-left',sizes.tweetMarginLeft + 'px')
      .style('top',sizes.photoTop + 'px')
      .style('border-radius','20px')
      .style('height',sizes.photoHeight + 'px');

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

    var brush = d3.svg.brush()
        .x(x)
        .on("brush", brushed);

    var brushElement = svg.append("g")
        .attr("class", "brushElement")
        .call(brush)
      .selectAll("rect")
        .attr("y", 0)
        .attr("height", sizes.timelineHeight);

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

    function brushed(){
        // create an array of tweetID matching the brushed range
        var tweetIDs = [];
        d3.selectAll(".tweet_location").each(function(d) {
           // add a border to the tweet list
            d3.select("#tweets")
              .style('border','2px solid');
            var checkDate = new Date(this.getAttribute("timeStamp"));
            var lowExtent = new Date(brush.extent()[0]),
                highExtent  = new Date(brush.extent()[1]);
            if (lowExtent <= checkDate && checkDate <= highExtent) {
              d3.select(this).style({fill: "red", stroke: "red"});
              tweetIDs.push(d3.select(this).attr("tweetID"))
            } else {
              d3.select(this).style({fill: "steelblue", stroke: "steelblue"});
            }
        })

        // remove tweet, tweet list, and photo
        d3.select("#tweets").selectAll('*').remove();
        d3.select("#tweet").selectAll('*').remove();
        d3.select('#photo').remove();

        tweetIDs.forEach(function(tweetID,i){
            // create new element
            d3.select("#tweets")
              .append("div")
              .attr("id","tweet"+i)
              .classed("tweetList",true);
            // embed new tweet
            twttr.widgets.createTweet(
            tweetID,
            document.getElementById('tweet'+i)
            );
        })
    }
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

function add_longlat_to_map(timeStamp,features,map,geoLayer){

    // add features to the map
    features.forEach(function(feature,i){
        //var feature["timeStamp"] = timeStamp;
        //var feature["timeStamp_str"] = timeStamp.toString();

        // add points to map try to do this directly w/ geoJson
        geoLayer.addData(feature);
    });
}

function convert_to_array(data,map){

    // to iterate, we transform the object to array
    var dataArray = d3.entries(data.time_series.interval_data);

    // function for parsing dates
    var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

    // create empty layer to add points
    //var geoLayer = L.geoJson().addTo(map)

    // parse dates and coerce values
    function iterate_(dataArray){
        parsedDataArray = [];
        dataArray.forEach(function(ts) {

          //console.log(ts.value.tweets_geo.features)
            //add_features_to_map(ts.key,ts.value.tweets_geo.features,map);
            //add_longlat_to_map(ts.key,ts.value.tweets_geo.features,map,geoLayer);

            // create timeline data
            if (ts.value.stats.hasOwnProperty("tweets")){
                var count = +ts.value.stats.tweets
            }else{
                var count = +0
            }
            parsedDataArray.push({
              key:parseDate(ts.key)
              , value:count
              , vit:ts.value.tweets_vit
            });
        });
        return parsedDataArray.sort(function(a,b){
            return b.key-a.key
        });
    }
    return iterate_(dataArray);
}

function decimal_count(num) {
  return (num.split('.')[1] || []).length;
}

function add_points_to_map(data,map){
    var dateArray = Object.keys(data.time_series.interval_data);
    var point_counts = {};
    dateArray.forEach(function(ts){
        if (data.time_series.interval_data[ts].hasOwnProperty("tweets_geo_with_media")){
            data.time_series.interval_data[ts].tweets_geo_with_media.forEach(function(feature){

                // get geo and metadata
                var longitude = feature.coordinates[0];
                var latitude  = feature.coordinates[1];
                var tweetUrl = feature.tweet_url;
                var tweetID = feature.tweet_url.split('/')[5];
                var mediaURL = feature.media;

                // remove this if block once the geo is corrected
                //if (decimal_count(latitude.toString())>4 & decimal_count(longitude.toString())>4){

                    // Use leaflet to add circles to the map
                    L.circleMarker([+latitude,+longitude],{
                        color: 'steelblue',
                        fillColor: 'steelblue',
                        fillOpacity: 0.2,
                        radius:10,
                        className: "tweet_location_pre_data"
                    }).addTo(map);

                    // add data to circles
                    d3.select(".tweet_location_pre_data")
                      .classed("tweet_location_pre_data",false)
                      .classed("tweet_location",true)
                      .classed("tweetID_"+tweetID,true)
                      .attr("tweet_url",tweetUrl)
                      .attr("tweetID",tweetID)
                      .attr("timeStamp",ts)
                      .attr("timeStampTag",ts.split(":")[0])
                      .attr("mediaURL",mediaURL);

                //}
            });
        }
    })
    // sort points
    var sorted_keys = Object.keys(point_counts).sort(function(a,b){return point_counts[b]-point_counts[a]})

    //output={};
    output=[];

    sorted_keys.forEach(function(name){
        output.push({name:point_counts[name]})
        //output[d]=point_counts[d]
    })

}
//d3.json("data/BoulderFlood_viewer.json", function(collection) {
d3.json("data/event_viewer4.json", function(collection) {
    console.log(["collection:",collection])

    // all sizes
    var sizes = set_sizes();

    // build map and creat an svg.
    var map = build_map();

    // build timeline
    var timelineData = convert_to_array(collection,map);
    create_timeline2(timelineData,sizes);

    // add point to map
    add_points_to_map(collection,map);

    // Adjust map & tweet orientation when window is resized.
    window.addEventListener('resize', function(event){
        //set_values(timelineData,dateParsed);
        var sizes = set_sizes();
        create_timeline2(timelineData,sizes);
    });

    // Mouseover event that produces embeded tweet
    var circles = d3.selectAll(".tweet_location")
    circles.on("mouseover",function(event){
        // removes the border on the tweet list
        d3.select("#tweets")
          .style('border',null);

        // removes old embeded tweet and tweet list
        var element = d3.select(this)
        d3.select("#tweets").selectAll('*').remove();
        d3.select("#tweet").selectAll('*').remove();

        // remove old photo
        d3.select('#photo').remove();

        // adds new embeded tweet
        twttr.widgets.createTweet(
            element.attr('tweetID'),
            document.getElementById('tweet')
        );

        // add new photo
        if (element.attr("mediaURL") != null){
            var photoURL = element.attr("mediaURL")
            if (photoURL.match("instagram.com") != null){
                    // embeds instagram photo
                    d3.select("body").append('img').attr('id','photo')
                      .attr('src','http://instagram.com/p/' + photoURL.split('/')[4] +'/media/?size=l')
                      .attr('border','2px solid')
                      .attr('border-radius','25px');
                }
        }
        var sizes = set_sizes();

    });
});
