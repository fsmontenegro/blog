var dataset; // a global
var localdata = [];
var industries;
d3.csv("/blog/data/vcdb-actions.csv", function(error, csv) {
    if (error) return console.warn(error);
    dataset = csv;
    setData("Overall")
    setInd();
    genVis();
});
function setInd() {
    industries = [];
    for(var i = 0; i<dataset.length; i++) {
        if (industries.indexOf(dataset[i].ind) < 0) {
            industries.push(dataset[i].ind)
        }
    }
}
function setData(ind) {
    localdata = []
    for(var i = 0; i<dataset.length; i++) {
        if (dataset[i].ind === ind) {
            localdata.push({ sname : dataset[i].label,
                pct : +dataset[i].ct,
                textover : dataset[i].summary,
                color : dataset[i].color });
        }
    }
}
// function taken from http://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(), word, 
        line = [], lineNumber = 0, lineHeight = 1.1, // ems 
        y = text.attr("y"), dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}
function genVis() {
    var margin = {top: 20, right: 100, bottom: 70, left: 50},
        width = 660 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;
    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1)
        .domain(localdata.map(function(d) { return d.sname; }));
    var y = d3.scale.linear()
        .range([height, 0])
        .domain([0, d3.max(localdata, function(d) { return d.pct; })]);
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10, "%");
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll(".tick text")
        .attr("font-size", "8px")
        .call(wrap, x.rangeBand());

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "translate(" + -1*margin.left + ",6),rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Frequency");
    svg.selectAll(".bar")
        .data(localdata)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("fill", function(d) { return d.color; })
        .attr("x", function(d) { return x(d.sname); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.pct); })
        .attr("height", function(d) { return height - y(d.pct); })
        .on("mouseover", function(d){ return tooltip.html(d.textover).style("visibility", "visible");})
        .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
        .on("mouseout", function(){return tooltip.style("visibility", "hidden");});
    svg.append("text")
        .attr("class", "stitle")
        .attr("transform", "translate(0, " + -1*margin.top + ")")
        .attr("x", width/2)
        .attr("y", 16)
        .style("text-anchor", "middle")
        .text("VCDB - Top 10 Threat Actions: Overall");
    svg.selectAll(".menu")
        .data(industries)
        .enter().append("text")
        .attr("class", "menu")
        .text(function(d) { return d; })
        .attr("transform", "translate(" + width + "," + margin.top + ")")
        .attr("x", 0)
        .attr("y", function(d, i) { return i * (height/industries.length) })
        .on("click", function(d) {
            setData(d);
            x.domain(localdata.map(function(d) { return d.sname; }));
            y.domain([0, d3.max(localdata, function(d) { return d.pct; })]);
            svg.select(".stitle").transition().duration(1000).text("VCDB - Top 10 Threat Actions: " + d);
            svg.select(".y.axis").transition().duration(1000).call(yAxis);
            svg.select(".x.axis").transition().duration(1000).call(xAxis)
                .selectAll(".tick text")
                .attr("font-size", "8px")
                .transition().duration(1000)
                .call(wrap, x.rangeBand());
            svg.selectAll(".bar")
                .data(localdata)
                .attr("class", "bar")
                .transition().duration(1000)
                .attr("fill", function(d) { return d.color; })
                .attr("x", function(d) { return x(d.sname); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(d.pct); })
                .attr("height", function(d) { return height - y(d.pct); });
        });
    var tooltip = d3.select("body")
        .append("div")
        .style("background-color", "white")
        .style("text-align", "left")
        .style("padding", "5px")
        .style("border", "1px solid black")
        .style("border-radius", "4px")
        .style("box-shadow", "2px 2px 5px #888888")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("font", "10px sans-serif")
        .text("a simple tooltip");
}
