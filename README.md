# Maperator
Replay twitter events to explore relevant geographic information as the conversation unfolds.    

## Process:
1. Talk about the final viz, collect data, talk about the final viz, format  
data, talk about the final viz, add 3rd party data, reformat data, ...  

2. Decide on inital region for map:  
West: -105.5270  
North: 40.2342  
East: -105.0233  
South: 39.9088  

3. Review resources.  
  - [D3 Map + Slider](http://tipstrategies.com/geography-of-jobs/)  
  - [D3 Slider Examples](http://thematicmapping.org/playground/d3/d3.slider/)  
  - [D3 + Leaflet.js](http://bl.ocks.org/milkbread/5885443)

4. Create a map and add points using the [tutorial on Leaflet.js](http://leafletjs.com/examples/quick-start.html)  
![](https://raw.githubusercontent.com/blehman/maperator/master/imgs/mapPoints.png)

5. Learn how to embed tweets programatically. 
  - [Set up Twitter for Websites](https://dev.twitter.com/web/javascript/loading)
  - [Embedded Tweet JavaScript Factory Function](https://dev.twitter.com/web/embedded-tweets/javascript-create)

6. Build a [line graph](http://bl.ocks.org/mbostock/3883245) for Tweet volume.  
![](https://raw.githubusercontent.com/blehman/maperator/master/imgs/timelineEmbed.png)

7. Learn jitter techniques and apply an appropriate solution.
 - [Force directed jitter](http://bl.ocks.org/rpgove/10603627) 
 - [Custom projection](https://gist.github.com/mbostock/5663666)
 - [Ongoing discussion](http://stackoverflow.com/questions/27241216/jittering-geo-paths-using-d3-js)
 - [Simple random jitter](https://github.com/blehman/maperator/blob/master/js/viz4.js#L31)
![](https://raw.githubusercontent.com/blehman/maperator/master/imgs/jitter.png)

8. Learn how to dynamically update the map based on mouse's position in
   the timeline.
 - [Line graph tooltip] (http://bl.ocks.org/d3noob/e5daff57a04c2639125e)  
![](https://raw.githubusercontent.com/blehman/maperator/master/imgs/dynamicUpdating.png)

9. Learn how to embed photos from instagram.
 - [It looks "simple"](https://instagram.com/developer/embedding/#)
 - [Asked a StackOverflow question](http://stackoverflow.com/questions/29133104/using-instagrams-oembed-with-d3#question)
 - [Create work-around](http://stackoverflow.com/questions/29133104/using-instagrams-oembed-with-d3#answer-29139135)
![](https://raw.githubusercontent.com/blehman/maperator/master/imgs/instagram.png)


10. Ideas for iteration:
 - New statistics field (both global and interval level).
 - Radio buttons for timeline stats.
 - Bar graph for external data by date.
 - New data format:  
    - TimeStamp
        - stats (total_tweets, media_total, geo_total, optional_hashtag_count)
        - tweets_geo: (geoJson w/ properties: tweet_url, media_native, media_external, geo_type)
        - tweets_VIT: (set of tweet urls)
    
