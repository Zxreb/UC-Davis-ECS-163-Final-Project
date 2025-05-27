// main.js
const histSVG   = d3.select("#hist-chart svg");
const pieSVG    = d3.select("#pie-chart svg");
const dendroSVG = d3.select("#dendro-chart svg");
const tooltip   = d3.select("#tooltip");

const margin = { top: 30, right: 30, bottom: 60, left: 60 };
const fullW  = parseInt(histSVG.style("width"));
const fullH  = parseInt(histSVG.style("height"));
const W      = fullW  - margin.left - margin.right;
const H      = fullH  - margin.top  - margin.bottom;

let data, statuses, allowedStatuses, selectedStatus = null;
let colorScale, histG, pieG, dendroG;

// 1) LOAD & CLEAN
d3.csv("student_habits_performance.csv", d => ({
  study: +d["study_hours_per_day"],
  exam:  +d["exam_score"],
  job:   d["part_time_job"] === "Yes" ? "Part-time" : "No job"
}))
.then(raw => {
  data = raw.filter(d =>
    !isNaN(d.study) && !isNaN(d.exam) && d.job
  );

  statuses = Array.from(new Set(data.map(d => d.job)));
  colorScale = d3.scaleOrdinal()
    .domain(statuses)
    .range(d3.schemeSet2);

  allowedStatuses = new Set(statuses);

  drawHistogram();
  drawPie();
  drawDendrogram();
})
.catch(console.error);


// 2) HISTOGRAM + BRUSH
function drawHistogram() {
  histG = histSVG.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.study)).nice()
    .range([0, W]);

  const bins = d3.bin()
    .domain(x.domain())
    .thresholds(20)(data.map(d => d.study));

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)]).nice()
    .range([H, 0]);

  histG.selectAll("rect")
    .data(bins).enter().append("rect")
      .attr("x",      d => x(d.x0) + 1)
      .attr("y",      d => y(d.length))
      .attr("width",  d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("height", d => H - y(d.length))
      .attr("fill",   "#69b3a2")
      .on("mouseenter", (e,d) => {
        tooltip.style("display","block")
               .html(`<strong>${d.x0.toFixed(1)}–${d.x1.toFixed(1)} hrs</strong><br/>Count: ${d.length}`);
      })
      .on("mousemove", e => {
        tooltip.style("top",(e.pageY+10)+"px")
               .style("left",(e.pageX+10)+"px");
      })
      .on("mouseleave", () => tooltip.style("display","none"));

  histG.append("g")
    .attr("transform", `translate(0,${H})`)
    .call(d3.axisBottom(x));

  histG.append("g")
    .call(d3.axisLeft(y));

  histG.append("text")
    .attr("x",W/2).attr("y",H+45).attr("text-anchor","middle")
    .text("Study hours per day");

  histG.append("text")
    .attr("transform","rotate(-90)")
    .attr("x",-H/2).attr("y",-45).attr("text-anchor","middle")
    .text("Number of students");

  // brush
  const brush = d3.brushX()
    .extent([[0,0],[W,H]])
    .on("end", onBrush);

  histG.append("g").attr("class","brush").call(brush);

  function onBrush({selection}) {
    if (!selection) {
      allowedStatuses = new Set(statuses);
    } else {
      const [x0,x1] = selection.map(x.invert);
      const inRange = data.filter(d => d.study >= x0 && d.study <= x1);
      allowedStatuses = new Set(inRange.map(d => d.job));
    }
    updatePie();
    updateDendrogram();
  }
}


// 3) PIE CHART + CLICK
function drawPie() {
  const counts = d3.rollup(data, v => v.length, d => d.job);
  const total  = d3.sum(counts.values());
  const pieGen = d3.pie().value(d => d[1]);
  const arcGen = d3.arc()
    .innerRadius(0)
    .outerRadius(Math.min(W,H)/2 - 10);

  pieG = pieSVG.append("g")
    .attr("transform", `translate(${margin.left+W/2},${margin.top+H/2})`);

  pieG.selectAll("path")
    .data(pieGen([...counts]))
    .enter().append("path")
      .attr("d", arcGen)
      .attr("fill", d => colorScale(d.data[0]))
      .attr("stroke","white").attr("stroke-width",1)
      .on("click", (e,d) => {
        const job = d.data[0];
        selectedStatus = selectedStatus === job ? null : job;
        updatePie();
        updateDendrogram();
      })
      .on("mouseenter", (e,d) => {
        const [job,c] = d.data;
        const pct = ((c/total)*100).toFixed(1);
        tooltip.style("display","block")
               .html(`<strong>${job}</strong><br/>${pct}%`);
      })
      .on("mousemove", e => {
        tooltip.style("top",(e.pageY+10)+"px")
               .style("left",(e.pageX+10)+"px");
      })
      .on("mouseleave", () => tooltip.style("display","none"));

  // legend
  const legend = pieSVG.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  Array.from(counts.keys()).forEach((job,i) => {
    const row = legend.append("g")
      .attr("transform", `translate(0,${i*20})`);
    row.append("rect")
      .attr("width",12).attr("height",12)
      .attr("fill", colorScale(job));
    row.append("text")
      .attr("x",18).attr("y",10)
      .text(job)
      .attr("font-size","12px");
  });
}

function updatePie() {
  pieG.selectAll("path")
    .transition().duration(500)
      .style("opacity", d =>
        allowedStatuses.has(d.data[0]) &&
        (!selectedStatus || d.data[0] === selectedStatus)
          ? 1 : 0.2
      )
      .attr("stroke-width", d =>
        d.data[0] === selectedStatus ? 3 : 1
      )
      .attr("stroke", d =>
        d.data[0] === selectedStatus ? "black" : "white"
      );
}


// 4) DENDROGRAM
function drawDendrogram() {
    // rollup job → exam-score bins
    const roll = d3.rollup(
      data,
      v => d3.rollup(v,
        vv => vv.length,
        d => d.exam >= 85 ? "High" : d.exam >= 70 ? "Mid" : "Low"
      ),
      d => d.job
    );
  
    const nested = {
      name: "Job Status",
      children: Array.from(roll, ([job,map]) => ({
        name: job,
        children: ["High","Mid","Low"].map(bin => ({
          name:  `${bin} (${map.get(bin)||0})`,
          value: map.get(bin)||0
        }))
      }))
    };
  
    const root = d3.hierarchy(nested)
      .sum(d => d.value)
      .sort((a,b) => b.value - a.value);
  
    // compute layout sizes
    const leafCount = root.leaves().length;
    const rowH      = 30;
    const vSize     = leafCount * rowH;
    const hSize     = fullW - margin.left - margin.right;
  
    // bump the dendrogram SVG height & (optional) width
    dendroSVG
      .attr("height", vSize + margin.top + margin.bottom);
  
    // compute the tree layout
    const tree = d3.tree().size([vSize, hSize]);
    tree(root);
  
    // shift the entire group RIGHT by an extra 80px
    const extraLeft = 80;
    dendroG = dendroSVG.append("g")
      .attr("transform", `translate(${margin.left + extraLeft},${margin.top})`);
  
    // links
    dendroG.selectAll("path.link")
      .data(root.links()).enter().append("path")
        .attr("fill","none")
        .attr("stroke","#555")
        .attr("d", d3.linkHorizontal().x(d=>d.y).y(d=>d.x));
  
    // nodes
    const nodes = dendroG.selectAll("g.node")
      .data(root.descendants()).enter().append("g")
        .attr("transform", d => `translate(${d.y},${d.x})`);
  
    // circles
    nodes.append("circle")
      .attr("r",6)
      .attr("fill", d => {
        if (d.depth === 1) return colorScale(d.data.name);
        if (d.depth === 2) {
          if (d.data.name.startsWith("High")) return "#2ca02c";
          if (d.data.name.startsWith("Low"))  return "#d62728";
          return "#ff7f0e";  // Mid
        }
        return "#999";      // root
      })
      .on("mouseenter",(e,d)=>{
        if (!d.children) {
          const bin = d.data.name.split(" ")[0];
          tooltip.style("display","block")
                 .html(`<strong>${d.parent.data.name} → ${bin}</strong><br/>Count: ${d.data.value}`);
        }
      })
      .on("mousemove",e=>{
        tooltip.style("top",(e.pageY+10)+"px")
               .style("left",(e.pageX+10)+"px");
      })
      .on("mouseleave",()=>tooltip.style("display","none"));
  
    // labels
    nodes.append("text")
      .attr("dy",3)
      .attr("x", d => d.children ? -8 : 8)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .style("pointer-events","none")
      .text(d => d.data.name);
  
    updateDendrogram();
  }

function updateDendrogram() {
  dendroG.selectAll("g")
    .transition().duration(500)
      .style("opacity", d => {
        if (d.depth === 1) {
          return allowedStatuses.has(d.data.name) &&
                 (!selectedStatus || d.data.name === selectedStatus)
            ? 1 : 0.2;
        }
        if (d.depth === 2) {
          const job = d.parent.data.name;
          return allowedStatuses.has(job) &&
                 (!selectedStatus || job === selectedStatus)
            ? 1 : 0.2;
        }
        return 1; // root
      });
}
