var map = L.map('map').setView([52.52,13.384], 13);
  var toolserver = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png');
  var stamen = L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {attribution: 'Add some attributes here!'}).addTo(map);
  var baseLayers = {"stamen": stamen, "toolserver-mapnik":toolserver};
  

  var geojson = L.geoJson(roads, {
      onEachFeature: onEachFeature
  }).addTo(map)

  var overlays = {
          "geoJson": geojson
    };
  
  function onEachFeature(feature, layer){
    if (feature.properties) {
        layer.bindPopup("<b>" + feature.properties.street + "</b> is " + feature.properties.length + "km long.");
    }
  }
  
  var svgContainer= d3.select(map.getPanes().overlayPane).append("svg");
  var group= svgContainer.append("g").attr("class", "leaflet-zoom-hide");
  var path = d3.geo.path().projection(project);  
   
  d3.json("data/roads2.js", function(collection) {
    
    console.log([collection])
    console.log(roads)
    
    var roadsTest = [collection];

    var geojson_d3 = L.geoJson(roadsTest, {
        onEachFeature: onEachFeature
    })

    overlays["geojson_d3"] = geojson_d3;

    d3.json("data/roads2_topo.json", function(error, topology) {
      //console.log(topology)
      var collection2 = topojson.feature(topology, topology.objects.roads2);
      var roadsTopoJSON = [collection2];
      
      console.log(roadsTopoJSON)
      
      var geojson_tj = L.geoJson(roadsTopoJSON, {
          onEachFeature: onEachFeature
      });

      overlays["geojson_topojson"] = geojson_tj;

      //console.log(collection.features[0].geometry.coordinates)

      var control = L.control.layers(baseLayers, overlays).addTo(map);

      //***described code can be found in the function 'setFeature()'...I need that as function to the 'hide/show overlay'
      var feature;
      setFeature();
      //****
      
      var bounds = d3.geo.bounds(collection2);        
        
      reset();

      map.on("viewreset", reset);
      map.on("drag", reset);
  
      feature.on("mousedown",function(d){
        var coordinates = d3.mouse(this);

        //console.log(d,coordinates,map.layerPointToLatLng(coordinates))

        L.popup()
        .setLatLng(map.layerPointToLatLng(coordinates))
        .setContent("<b>" + d.properties.street + "</b> is " + d.properties.length + "km long.")
        .openOn(map);
      });

      var transition_destination = -1;
      feature.on("mousemove",function(d){
        d3.select(this).transition().duration(2500).ease('bounce')
          .style("stroke","#0f0")
          .attr("transform", "translate(0,"+transition_destination*50+")");
        transition_destination=transition_destination*(-1);
      }) 

      function reset() {
        bounds = [[map.getBounds()._southWest.lng, map.getBounds()._southWest.lat],[map.getBounds()._northEast.lng, map.getBounds()._northEast.lat]]
        var bottomLeft = project(bounds[0]),
            topRight = project(bounds[1]);

        svgContainer.attr("width", topRight[0] - bottomLeft[0])
            .attr("height", bottomLeft[1] - topRight[1])
            .style("margin-left", bottomLeft[0] + "px")
            .style("margin-top", topRight[1] + "px");

        group.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")"); 

        feature.attr("d", path);

      }

      //******Additional: hide/show overlay ******
      var content = "hide overlay", color='#070';
      svgContainer.append("text").text(content)
          .attr("x", 50).attr("y", 50)
          .style("font-size","30px").style("stroke",color)
          .on("mouseover",function(d){
              if(content=='hide overlay'){
                content='show overlay';color='#f70'; 
                group.selectAll('path').remove();
              }
              else {
               content='hide overlay';color='#070';
               setFeature();
               reset();
              }
              d3.select(this).text(content).style("stroke",color)
      });

      //this is just a function from the existing code...as I need it to restore the removed paths
      function setFeature(){
        feature = group.selectAll("path")
          .data(collection2.features)
          .enter()
          .append("path")
          .attr("id","overlay");
      }
      //***************************
    })    

  })

function project(point) {
    var latlng = new L.LatLng(point[1], point[0]);
    var layerPoint = map.latLngToLayerPoint(latlng);
    return [layerPoint.x, layerPoint.y];
  }
