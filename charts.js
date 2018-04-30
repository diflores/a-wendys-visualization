d3.csv("wendys_sample.csv", function (data) {
    var wendysMarkers = new L.FeatureGroup();
    L.mapbox.accessToken = 'pk.eyJ1IjoiZGlmbG9yZXMiLCJhIjoiY2VjNzc2ZjdmZGIwMjdmYzNjNjU5NDBlMmM3M2U4ODIifQ.u6oG-2m5DS7SqXFMCERIsQ';
    var mapboxTiles = L.tileLayer('https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=a2087a09e290451d9c7c6a544d54b12d', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    var map = L.map('map')
        .addLayer(mapboxTiles)
        .setView([-40, -71.0587], 20);


    var fullDateFormat = d3.time.format("%Y/%m/%d");
    var yearFormat = d3.time.format("%Y");


    // Parseo fechas
    data.forEach(function (d) {
        d.rating = +d.rating;
        d.foundation_full = fullDateFormat.parse(d.foundation_date);
        d.foundation_year = +yearFormat(d.foundation_full);
    })

    // Entrego mis datos a crossfilter para hacer funcionar los gráficos/mapa
    var myData = crossfilter(data);

    // Variable independiente ("ejes X")
    var myDataDimension = myData.dimension(function (d) {
        return d;
    });
    var yearDimension = myData.dimension(function (d) {
        return d.foundation_year;
    });
    var dayDimension = myData.dimension(function (d) {
        return d.day_of_week;
    });
    var ratingDimension = myData.dimension(function (d) {
        return d.rating;
    });
    var dateDimension = myData.dimension(function (d) {
        return d.foundation_full;
    })

    // Variable dependiente ("ejes Y")
    var restaurantsYear = yearDimension.group().reduceCount();
    var restaurantsDay = dayDimension.group().reduceCount();
    var restaurantsRating = ratingDimension.group().reduceCount();
    var restaurantsDate = dateDimension.group().reduceCount();


    var yearChart = dc.pieChart("#chart-ring-year");
    var dayChart = dc.pieChart("#chart-ring-day");
    var ratingChart = dc.barChart("#rating");
    var dataTable = dc.dataTable('#data-table');
    var dateChart = dc.lineChart("#dates");

    var dataArray = []

    data.forEach(function (d) {
        dataArray.push(d.foundation_full);
    })



    dateChart
        .width(1000)
        .height(150)
        .dimension(dateDimension)
        .group(restaurantsDate)
        .x(d3.time.scale().domain([Math.min.apply(null, dataArray), Math.max.apply(null, dataArray)]))
        .elasticY(true)
        //.centerBar(true)
        .xAxisLabel('Date')
        .yAxisLabel('Amount')
        .margins({
            top: 10,
            right: 20,
            bottom: 50,
            left: 50
        });
    ratingChart.xAxis().tickValues([0, 1, 2, 3, 4, 5]);


    yearChart
        .width(150)
        .height(150)
        .dimension(yearDimension)
        .group(restaurantsYear)
        .innerRadius(20);

    dayChart
        .width(150)
        .height(150)
        .dimension(dayDimension)
        .group(restaurantsDay)
        .innerRadius(20);

    ratingChart
        .width(300)
        .height(180)
        .dimension(ratingDimension)
        .group(restaurantsRating)
        .x(d3.scale.linear().domain([0, 6]))
        .elasticY(true)
        .centerBar(true)
        .xAxisLabel('Rating')
        .yAxisLabel('Amount')
        .margins({
            top: 10,
            right: 20,
            bottom: 50,
            left: 50
        });
    ratingChart.xAxis().tickValues([0, 1, 2, 3, 4, 5]);

    dataTable
        .dimension(myDataDimension)
        .group(function (d) {
            return "I need to get rid of this row.";
        })
        .size(5879)
        .columns([
            function (d) {
                return d.name;
            },
            function (d) {
                return d.foundation_date;
            },
            function (d) {
                return d.address;
            },
            function (d) {
                return d.rating;
            },
        ])
        .sortBy(function (d) {
            return d.rating;
        })

        // Markers
        .renderlet(function (table) {
            wendysMarkers.clearLayers();
            _.each(myDataDimension.top(Infinity), function (d) {
                var name = d.name
                var marker = L.marker([d.latitude, d.longitude])
                marker.bindPopup("<p>" + name + "</p>");
                wendysMarkers.addLayer(marker)
            });
            map.addLayer(wendysMarkers);
            map.fitBounds(wendysMarkers.getBounds());
        })
        .order(d3.ascending);
    dc.renderAll();
})