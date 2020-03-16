function scaleBetween(unscaledNum, minAllowed, maxAllowed, min, max) {
    return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
}

var gauge = function(container, configuration) {
    var that = {};
    var config = {
        size						: 1500,
        clipWidth					: 500,
        clipHeight					: 410,
        ringInset					: 20,
        ringWidth					: 20,
        
        pointerWidth				: 15,
        pointerTailLength			: 10,
        pointerHeadLengthPercent	: 0.9,
        
        minValue					: 0,
        maxValue					: 700,
        
        minAngle					: -90,
        maxAngle					: 90,
        
        transitionMs				: 100,
        
        majorTicks					: 8,
        labelFormat					: d3.format(',g'),
        labelInset					: 10,
        
        arcColorFn					: d3.interpolateRdYlGn,
        hasMarkers                  : true,
    };
    var range = undefined;
    var r = undefined;
    var pointerHeadLength = undefined;
    
    var svg = undefined;
    var arc = undefined;
    var scale = undefined;
    var ticks = undefined;
    var tickData = undefined;
    var pointer = undefined;
    var score = undefined;
    var trueScale = undefined;

    var progress = undefined;
    var progressText = undefined;
    var progressWidth = 420;

    var hasMetric = undefined;
    var hasHand = undefined;
    
    function deg2rad(deg) {
        return deg * Math.PI / 180;
    }
    
    function newAngle(d) {
        var ratio = scale(d);
        var newAngle = config.minAngle + (ratio * range);
        return newAngle;
    }
    
    function configure(configuration) {
        var prop = undefined;
        for (prop in configuration) {
            config[prop] = configuration[prop];
        }
        
        range = config.maxAngle - config.minAngle;
        r = config.size / 2;
        pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

        // a linear scale that maps domain values to a percent from 0..1
        scale = d3.scaleLinear()
            .range([0,1])
            .domain([config.minValue, config.maxValue]);

        trueScale = (newValue) => {
            if (newValue >= 700) {
                newValue = 750
            }
            if (newValue < 100) {
                newValue = 50
            }

            return scale((newValue / 800) * config.maxValue)
        }

        ticks = scale.ticks(config.majorTicks);
        tickData = d3.range(config.majorTicks).map(function() { return 1 / config.majorTicks; });
        
        arc = d3.arc()
            .innerRadius(r - config.ringWidth - config.ringInset)
            .outerRadius(r - config.ringInset)
            .startAngle(function(d, i) {
                var ratio = d * i;
                return deg2rad(config.minAngle + (ratio * range));
            })
            .endAngle(function(d, i) {
                var ratio = d * (i+1);
                return deg2rad(config.minAngle + (ratio * range));
            });
    }
    that.configure = configure;
    
    function centerTranslation() {
        return 'translate('+r +','+ r +')';
    }
    
    function isRendered() {
        return (svg !== undefined);
    }
    that.isRendered = isRendered;
    
    function render(newValue) {
        d3.select(container).select("svg").remove()

        svg = d3.select(container)
            .append('svg')
                .attr('class', 'gauge')
                .attr('width', config.clipWidth)
                .attr('height', config.clipHeight);
        
        var centerTx = centerTranslation();
        
        var arcs = svg.append('g')
                .attr('class', 'arc')
                .attr('transform', centerTx);
        
        arcs.selectAll('path')
                .data(tickData)
            .enter().append('path')
                .attr('fill', function(d, i) {
                    if (i == 0) {
                        return "rgb(219, 219, 219)"
                    }
                    if (i == 1) {
                        return "rgb(126, 200, 80)"
                    }
                    if (i > 1 && i < 4) {
                        return d3.interpolateGreens(d * (i + 1))
                    }
                    else {
                        return config.arcColorFn(1 - (d * (i + 1)));
                    }
                })
                .attr('d', arc);

        if (config.hasMarkers) { 
        const ranges = [
            "000",
            "100 - 199",
            "200 - 299",
            "300 - 399",
            "400 - 499", 
            "500 - 599", 
            "600 - 699",
            "700"
        ]
        
        var lg = svg.append('g')
                .attr('class', 'label')
                .attr('transform', centerTx);
        lg.selectAll('text')
                .data(ticks)
            .enter().append('text')
                .attr('transform', function(d, i) {
                    var heights  = [10, 78, 135, 175, 135, 105, 60, 10]
                    var widths   = [85, 10, -20, -27, 12, -10, -48, -85]
                    var rotation = [0, 24, 48, 70, -69, -45, -23, 0]

                    var ratio = scale(d);
                    let x = scaleBetween(ratio, -r, r, 0, 1) + widths[i]
                    let y = -heights[i]
                    return `translate(${x}, ${y}), rotate(${rotation[i]})`
                })
                .text((_, i) => `${ranges[i]}`);

        }
        var lineData = [ 
            [config.pointerWidth / 2, 0], 
            [0, -pointerHeadLength],
            [-(config.pointerWidth / 2), 0],
            [0, config.pointerTailLength],
            [config.pointerWidth / 2, 0] 
        ];

        if (config.hasHand) {
            var pointerLine = d3.line();
            var pg = svg.append('g').data([lineData])
                    .attr('class', 'pointer')
                    .attr('transform', `translate(${r}, ${r})`);
                    
            var ratio = trueScale(newValue);
            var newAngle = config.minAngle + (ratio * range);

            pointer = pg.append('path')
                .attr('d', pointerLine)
                .attr('transform', 'rotate(' + newAngle +')');
        }

        if (config.hasMetric) {
            var xsub = -40

            var scoreClass = "score"
            if (config.metricClass) {
                scoreClass = config.metricClass
                xsub = -25
            }

            var sg = svg.append('g')
                .attr("class", scoreClass)

            var ysub = 80
            if (!config.hasHand) {
                ysub = 0
            }
            
            var scoreText = "000"
            if (newValue) {
                scoreText = newValue.toString().padStart(3, '0')
            }

            score = sg.append("text")
                    .attr('transform', `translate(${r + xsub}, ${r + ysub})`)
                    .text(scoreText)
        }

        if (config.hasProgressBar) {
            let confidence = 0.0

            let ysub = 130
            if (!config.hasMetric || !config.hasMetric) {
                ysub = 60
            }

            var progressg = svg.append('g')
                .attr("class", "progressbar")
                .attr('transform', `translate(${r - 230}, ${r + ysub})`)

            progressg.append('rect')
                .attr('class', 'bg-rect')
                .attr('rx', 10)
                .attr('ry', 10)
                .attr('fill', 'rgb(219, 219, 219)')
                .attr('height', 15)
                .attr('width', progressWidth)

            progress = progressg.append('rect')
                .attr('class', 'progress-rect')
                .attr('fill', config.arcColorFn(0))
                .attr('height', 15)
                .attr('width', function(){
                    return confidence * progressWidth;
                })
                .attr('rx', 10)
                .attr('ry', 10)

            progressText = progressg.append("text")
                .attr("x", progressWidth + 20)
                .attr("y", 12)
                .style("font-size", "16px")
                .text(`${confidence * 100}%`)

        }


        if (config.title) {
            var title = svg.append('g')
                // .attr("class", "score")
                .attr('transform', `translate(${r - 30}, ${r + 60})`)

            title.append("text")
                .text(config.title)
        }
    }
    that.render = render;
    
    function update(newValue, newConfiguration) {
        if (newConfiguration !== undefined) {
            configure(newConfiguration)
            render(newValue)
        }

        var ratio = trueScale(newValue);
        var newAngle = config.minAngle + (ratio * range);

        if (config.hasHand) {
            pointer.transition()
                .duration(config.transitionMs)
                .attr('transform', 'rotate(' +newAngle +')')
        }

        if (score && config.hasMetric) {
            var xsub = -40
            if (config.metricClass) {
                xsub = -25
            }

            var ysub = 80
            if (!config.hasHand) {
                ysub = 0
            }

            score.text(newValue.toString().padStart(3, '0'))
                .attr('transform', `translate(${r + xsub}, ${r + ysub})`)
        }
    }
    that.update = update;

    function confidence(confidence) {
        progress.transition()
			.duration(1000)
			.attr('fill', function(){
				return config.arcColorFn(confidence);
			})
			.attr('width', function(){
				return confidence * progressWidth;
            });
        progressText.text(`${confidence*100}%`)
    }
    that.confidence = confidence;

    configure(configuration);
    return that;
};