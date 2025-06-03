// main.js

// D3 Visual Setup
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

  // Prevent Rerendering
let triggered = new Set();

// Load CSV and clean
d3.csv("student_habits_performance.csv", d => ({
  study: +d.study_hours_per_day,
  sleep: +d.sleep_hours,
  social: +d.social_media_hours,
  netflix: +d.netflix_hours,
  attend: +d.attendance_percentage,
  diet_quality: d.diet_quality.trim(), 
  diet_numeric: { Poor: 1, Fair: 2, Good: 3, Excellent: 4 }[d.diet_quality.trim()] || 2,
  exercise: +d.exercise_frequency,
  extracurricular: d.extracurricular_participation.trim(),
  mental: +d.mental_health_rating,
  exam: +d.exam_score
})).then(data => {
  // Preprocess diet
  const dietMap = { Poor: 1, Fair: 2, Good: 3, Excellent: 4 };
  data.forEach(d => d.diet = dietMap[d.diet] || 2);

  setupScrollObserver(data);
});

function setupScrollObserver(data) {
  const sections = document.querySelectorAll("section");

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const isVisible = entry.isIntersecting;

        // Remove previous chart
        const svg = entry.target.querySelector("svg");
        if (!isVisible && svg) {
          d3.select(svg).selectAll("*")
            .transition().duration(300)
            .style("opacity", 0)
            .remove();
          triggered.delete(id);
        }

        // Add chart if not triggered
        if (isVisible && !triggered.has(id)) {
          triggered.add(id);
          switch (id) {
            case "study-slide": renderStudy(data); break;
            case "sleep-slide": renderSleep(data); break;
            case "social-slide": renderSocial(data); break;
            case "parallel-slide": renderParallel(data); break;
            case "violin-slide": renderViolin(data); break;
            case "bubble-slide": renderBubble(data); break;
            case "attendance-slide": renderAttendance(data); break;
            case "diet-slide": renderDiet(data); break;
            case "radial-slide": renderRadialProfiles(data); break;
            case "time-slide": renderTimeAllocation(data); break;

          }
        }
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach(s => observer.observe(s));
}

// VISUAL 1: Study Hours Histogram
function renderStudy(data) {
  const svg = d3.select("#study");

  const margin = { top: 40, right: 30, bottom: 50, left: 50 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  svg.attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.study)).nice()
    .range([0, width]);

  const bins = d3.bin()
    .domain(x.domain())
    .thresholds(10)(data.map(d => d.study));

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)]).nice()
    .range([height, 0]);

  // Bars
  g.selectAll("rect")
    .data(bins)
    .enter().append("rect")
    .attr("x", d => x(d.x0) + 1)
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 2))
    .attr("y", height)
    .attr("height", 0)
    .attr("fill", "#69b3a2")
    .on("mouseover", (e, d) => {
      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`Study Range: ${d.x0.toFixed(1)}–${d.x1.toFixed(1)}<br/>Count: ${d.length}`)
        .style("left", `${e.pageX + 5}px`)
        .style("top", `${e.pageY - 28}px`);
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("opacity", 0);
    })
    .transition().duration(800)
    .attr("y", d => y(d.length))
    .attr("height", d => height - y(d.length));

  // Axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.append("g")
    .call(d3.axisLeft(y));

  // Axis Labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Study Hours Per Day");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .text("Number of Students");
}

// VISUAL 2: Sleep vs Exam Score
function renderSleep(data) {
  const svg = d3.select("#sleep");

  const margin = { top: 40, right: 30, bottom: 50, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  svg.attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.sleep)).nice()
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

  // Axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));
  g.append("g")
    .call(d3.axisLeft(y));

  // Axis Labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Sleep Hours per Day");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .text("Exam Score");

  // Circles
  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.sleep))
    .attr("cy", d => y(d.exam))
    .attr("r", 0)
    .attr("fill", "steelblue")
    .attr("opacity", 0.7)
    .on("mouseover", (e, d) => {
      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`Sleep: ${d.sleep} hrs<br/>Score: ${d.exam}`)
        .style("left", (e.pageX + 5) + "px")
        .style("top", (e.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("opacity", 0);
    })
    .transition().duration(600)
    .attr("r", 5);
}

// VISUAL 3: Social Media vs Exam
function renderSocial(data) {
  const svg = d3.select("#social");

  const margin = { top: 40, right: 30, bottom: 50, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  svg.attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.social)).nice()
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.append("g")
    .call(d3.axisLeft(y));

  // Axis Labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Social Media Hours per Day");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .text("Exam Score");

  // Circles
  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.social))
    .attr("cy", d => y(d.exam))
    .attr("r", 0)
    .attr("fill", "tomato")
    .attr("opacity", 0.7)
    .on("mouseover", (e, d) => {
      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`Social Media: ${d.social} hrs<br/>Score: ${d.exam}`)
        .style("left", (e.pageX + 5) + "px")
        .style("top", (e.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("opacity", 0);
    })
    .transition().duration(600)
    .attr("r", 5);
}

// VISUAL 4: Parallel Coordinates Plot
function renderParallel(data) {
  const svg = d3.select("#parallelchart");
  const margin = { top: 50, right: 50, bottom: 10, left: 50 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  svg.attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const dimensions = ["study", "sleep", "social", "netflix", "attend", "exercise", "mental"];

  const y = {};
  dimensions.forEach(dim => {
    y[dim] = d3.scaleLinear()
      .domain(d3.extent(data, d => +d[dim]))
      .range([height, 0]);
  });

  const x = d3.scalePoint()
    .range([0, width])
    .domain(dimensions);

  const color = d3.scaleSequential()
    .domain(d3.extent(data, d => d.exam))
    .interpolator(d3.interpolateTurbo);

  function path(d) {
    return d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));
  }

  // Draw all lines with smooth transition
  g.selectAll("path")
    .data(data)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", d => color(d.exam))
    .attr("stroke-width", 1.2)
    .attr("stroke-opacity", 0)
    .transition()
    .delay((d, i) => i * 3) // wave effect
    .duration(1000)
    .attr("stroke-opacity", 0.5);

  // Hover events (attach after transition)
  g.selectAll("path")
    .on("mouseover", function (e, d) {
      g.selectAll("path").transition().duration(100)
        .attr("stroke-opacity", 0.1);

      d3.select(this)
        .raise()
        .transition().duration(100)
        .attr("stroke-width", 3)
        .attr("stroke-opacity", 1)
        .attr("stroke", "#000");

      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`Exam Score: ${d.exam.toFixed(1)}`)
        .style("left", `${e.pageX + 5}px`)
        .style("top", `${e.pageY - 28}px`);
    })
    .on("mouseout", function () {
      g.selectAll("path")
        .transition().duration(200)
        .attr("stroke-width", 1.2)
        .attr("stroke-opacity", 0.5)
        .attr("stroke", d => color(d.exam));

      d3.select("#tooltip").style("opacity", 0);
    });

  // Axes
  dimensions.forEach(dim => {
    g.append("g")
      .attr("transform", `translate(${x(dim)},0)`)
      .call(d3.axisLeft(y[dim]))
      .append("text")
      .attr("y", -9)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .text(dim);
  });
}

// VISUAL 5: Violin Plot
function renderViolin(data) {
  const svg = d3.select("#violinplot");
  const margin = { top: 50, right: 30, bottom: 50, left: 60 };
  const width = 500 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  svg.attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const categories = ["Yes", "No"];
  const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);
  const x = d3.scaleBand().domain(categories).range([0, width]).padding(0.4);
  const xNum = d3.scaleLinear().range([0, x.bandwidth() / 2]);

  g.append("g").call(d3.axisLeft(y));
  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  // KDE setup
  function kernelDensityEstimator(kernel, X) {
    return function (V) {
      return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
    };
  }
  function kernelEpanechnikov(k) {
    return function (v) {
      v /= k;
      return Math.abs(v) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
  }

  const kde = kernelDensityEstimator(kernelEpanechnikov(7), d3.range(0, 100, 1));

  categories.forEach(cat => {
    const filtered = data.filter(d =>
      d.extracurricular === cat &&
      d.exam !== null && !isNaN(+d.exam)
    );
    const scores = filtered.map(d => +d.exam);
    if (scores.length < 3) return;

    const density = kde(scores);
    xNum.domain([0, d3.max(density, d => d[1])]);

    const fillColor = cat === "Yes" ? "steelblue" : "tomato";

    // Violin shapes with slow fade-in
    ["left", "right"].forEach(side => {
      g.append("path")
        .datum(density)
        .attr("fill", fillColor)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("opacity", 0)
        .transition().duration(1500)
        .attr("opacity", 0.5)
        .attr("d", d3.line()
          .curve(d3.curveBasis)
          .x(d => {
            const offset = xNum(d[1]);
            return x(cat) + x.bandwidth() / 2 + (side === "left" ? -offset : offset);
          })
          .y(d => y(d[0]))
        );
    });

    // Raincloud dots with hover
    g.selectAll(`.dot-${cat}`)
      .data(scores)
      .enter()
      .append("circle")
      .attr("class", `dot-${cat}`)
      .attr("cx", () => x(cat) + x.bandwidth() / 2 + (Math.random() - 0.5) * 10)
      .attr("cy", d => y(d))
      .attr("r", 2.5)
      .attr("fill", "#333")
      .attr("opacity", 0)
      .on("mouseover", (e, d) => {
        d3.select("#tooltip")
          .style("opacity", 1)
          .html(`<strong>${cat}</strong><br>Score: ${d.toFixed(1)}`)
          .style("left", `${e.pageX + 5}px`)
          .style("top", `${e.pageY - 28}px`);
      })
      .on("mouseout", () => {
        d3.select("#tooltip").style("opacity", 0);
      })
      .transition()
      .duration(1000)
      .attr("opacity", 0.6);
  });

  // Axis labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Extracurricular Participation");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .text("Exam Score");
}

// Visual 6 Bubble Plot
function renderBubble(data) {
  const svg = d3.select("#bubblechart");
  const margin = { top: 50, right: 30, bottom: 60, left: 60 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  svg.attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, d3.max(data, d => d.study)]).range([0, width]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.sleep)]).range([height, 0]);
  const r = d3.scaleSqrt().domain([0, 100]).range([2, 20]);

  g.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));

  // Axis labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .text("Study Hours per Day");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .text("Sleep Hours");

  // Bubbles
  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.study))
    .attr("cy", d => y(d.sleep))
    .attr("r", 0)
    .attr("fill", "rgba(70,130,180,0.6)")
    .attr("stroke", "#444")
    .attr("stroke-width", 1)
    .on("mouseover", (e, d) => {
      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`
          <strong>Exam Score:</strong> ${d.exam.toFixed(1)}<br>
          <strong>Study:</strong> ${d.study} hrs<br>
          <strong>Sleep:</strong> ${d.sleep} hrs
        `)
        .style("left", `${e.pageX + 5}px`)
        .style("top", `${e.pageY - 28}px`);
    })
    .on("mouseout", () => d3.select("#tooltip").style("opacity", 0))
    .transition()
    .duration(1000)
    .attr("r", d => r(d.exam));
}

// VISUAL 7: Attendance vs Exam Score
function renderAttendance(data) {
  const svg = d3.select("#attendancechart");
  const margin = { top: 50, right: 30, bottom: 60, left: 60 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  svg.attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Check data
  const filtered = data.filter(d => !isNaN(d.attend) && !isNaN(d.exam));
  console.log("Rendering Attendance Chart | Count:", filtered.length);

  // Scales
  const x = d3.scaleLinear().domain([0, 100]).range([0, width]);
  const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));

  // Labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .text("Attendance Percentage");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .text("Exam Score");

  // Points (with fade-in)
  g.selectAll("circle")
    .data(filtered)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.attend))
    .attr("cy", d => y(d.exam))
    .attr("r", 0)
    .attr("fill", "teal")
    .attr("opacity", 0)
    .on("mouseover", (e, d) => {
      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`
          <strong>Attendance:</strong> ${d.attend}%<br>
          <strong>Exam Score:</strong> ${d.exam.toFixed(1)}
        `)
        .style("left", `${e.pageX + 5}px`)
        .style("top", `${e.pageY - 28}px`);
    })
    .on("mouseout", () => d3.select("#tooltip").style("opacity", 0))
    .transition()
    .duration(1000)
    .attr("r", 4)
    .attr("opacity", 0.6);
}

// VISUAL 8: Diet Quality Distribution
function renderDiet(data) {
  const svg = d3.select("#dietchart");
  const margin = { top: 50, right: 30, bottom: 60, left: 60 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  svg.attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const dietLevels = ["Poor", "Fair", "Good", "Excellent"];
  const colorScale = d3.scaleOrdinal()
    .domain(dietLevels)
    .range(["#d73027", "#fc8d59", "#91bfdb", "#4575b4"]);

  const x = d3.scalePoint()
    .domain(dietLevels)
    .range([0, width])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  g.append("g").call(d3.axisLeft(y));

  // Labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .text("Diet Quality");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .text("Exam Score");

  // Filter and render dots
  g.selectAll("circle")
    .data(data.filter(d => dietLevels.includes(d.diet_quality) && !isNaN(d.exam)))
    .enter()
    .append("circle")
    .attr("cx", d => x(d.diet_quality) + (Math.random() - 0.5) * 20)  // jitter
    .attr("cy", d => y(d.exam))
    .attr("r", 4)
    .attr("fill", d => colorScale(d.diet_quality))
    .attr("opacity", 0.7)
    .on("mouseover", (e, d) => {
      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`
          <strong>Diet:</strong> ${d.diet_quality}<br>
          <strong>Score:</strong> ${d.exam.toFixed(1)}
        `)
        .style("left", `${e.pageX + 5}px`)
        .style("top", `${e.pageY - 28}px`);
    })
    .on("mouseout", () => d3.select("#tooltip").style("opacity", 0));
}
 
// VISUAL 9: Radial Student Profile Comparison
function renderRadialProfiles(data) {
  const svg = d3.select("#radialchart");
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;
  const radius = Math.min(width, height) / 2 - 40;

  svg.attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left + width/2},${margin.top + height/2})`);

  const metrics = [
    { key: "study", label: "Study Hours", domain: [0, 8] },
    { key: "sleep", label: "Sleep Hours", domain: [0, 10] },
    { key: "social", label: "Social Media", domain: [0, 5] },
    { key: "exercise", label: "Exercise Freq", domain: [0, 7] },
    { key: "attend", label: "Attendance %", domain: [0, 100] },
    { key: "exam", label: "Exam Score", domain: [0, 100] },
    { key: "mental", label: "Mental Health", domain: [0, 10] }
  ];

  const globalAvg = {};
  metrics.forEach(m => globalAvg[m.key] = d3.mean(data, d => d[m.key]));

  const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);
  const angleScale = d => (2 * Math.PI * metrics.findIndex(m => m.key === d)) / metrics.length;

  const axisGroup = g.append("g").attr("class", "axisWrapper");

  metrics.forEach(metric => {
    const angle = angleScale(metric.key);
    const r = rScale(100);
    const x = Math.sin(angle) * r;
    const y = -Math.cos(angle) * r;

    axisGroup.append("line")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", x).attr("y2", y)
      .attr("stroke", "#ddd");

    axisGroup.append("text")
      .attr("x", x * 1.15)
      .attr("y", y * 1.15)
      .style("font-size", "10px")
      .attr("text-anchor", angle > Math.PI ? "end" : "start")
      .attr("alignment-baseline", "middle")
      .text(metric.label);
  });

  [25, 50, 75, 100].forEach(level => {
    axisGroup.append("circle")
      .attr("r", rScale(level))
      .attr("fill", "none")
      .attr("stroke", "#eee");
  });

  function normalizeValue(d, metric) {
    const max = metric.domain[1];
    return (d[metric.key] / max) * 100;
  }

  const sorted = [...data].sort((a, b) => d3.ascending(a.exam, b.exam));
  const binCount = 10;
  const bins = Array.from({ length: binCount }, (_, i) => {
    const start = Math.floor((i * sorted.length) / binCount);
    const end = Math.floor(((i + 1) * sorted.length) / binCount);
    return {
      label: `${i * 10 + 1}-${(i + 1) * 10}%`,
      students: sorted.slice(start, end)
    };
  });

  // ✅ Prevent duplicate dropdown
  if (d3.select(".bin-selector").empty()) {
    const selector = d3.select("#radial-slide")
      .insert("div", ":first-child")
      .attr("class", "bin-selector")
      .style("text-align", "center")
      .style("margin-bottom", "20px");

    selector.append("label").text("Select Score Percentile Group: ");
    const select = selector.append("select").on("change", e => updateProfile(+e.target.value));

    select.selectAll("option")
      .data(bins)
      .enter()
      .append("option")
      .attr("value", (d, i) => i)
      .text(d => d.label);
  }

  updateProfile(9); // Start at top 10%

  function updateProfile(binIndex) {
    const bin = bins[binIndex];
    g.selectAll(".binProfile, .globalProfile, .avgLabel").remove();

    const binAvg = {};
    metrics.forEach(m => {
      binAvg[m.key] = d3.mean(bin.students, d => d[m.key]);
    });

    const globalPath = d3.lineRadial()
      .angle(d => angleScale(d.key))
      .radius(d => rScale(normalizeValue(globalAvg, d)))
      .curve(d3.curveCardinalClosed);

    g.append("path")
      .datum(metrics)
      .attr("class", "globalProfile")
      .attr("d", globalPath)
      .attr("fill", "rgba(100,100,100,0.1)")
      .attr("stroke", "#666")
      .attr("stroke-dasharray", "3,3");

    // Add inline label near first axis (e.g., top of chart)
    const firstAngle = angleScale(metrics[0].key);
    g.append("text")
      .attr("x", Math.sin(firstAngle) * rScale(normalizeValue(globalAvg, metrics[0])) + 5)
      .attr("y", -Math.cos(firstAngle) * rScale(normalizeValue(globalAvg, metrics[0])) - 5)
      .text("Total Averages")
      .style("font-size", "10px")
      .attr("fill", "#666");

    const binPath = d3.lineRadial()
      .angle(d => angleScale(d.key))
      .radius(d => rScale(normalizeValue(binAvg, d)))
      .curve(d3.curveCardinalClosed);

    g.append("path")
      .datum(metrics)
      .attr("class", "binProfile")
      .attr("d", binPath)
      .attr("fill", "rgba(30,144,255,0.2)")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);

    metrics.forEach(metric => {
      const angle = angleScale(metric.key);
      const binVal = normalizeValue(binAvg, metric);
      const globalVal = normalizeValue(globalAvg, metric);

      g.append("circle")
        .attr("class", "binProfile")
        .attr("cx", Math.sin(angle) * rScale(binVal))
        .attr("cy", -Math.cos(angle) * rScale(binVal))
        .attr("r", 4)
        .attr("fill", "steelblue")
        .on("mouseover", (e) => {
          d3.select("#tooltip")
            .style("opacity", 1)
            .html(`
              <strong>${metric.label}</strong><br>
              Group Avg: ${binAvg[metric.key].toFixed(1)}<br>
              Class Avg: ${globalAvg[metric.key].toFixed(1)}
            `)
            .style("left", `${e.pageX + 5}px`)
            .style("top", `${e.pageY - 28}px`);
        })
        .on("mouseout", () => d3.select("#tooltip").style("opacity", 0));

      g.append("circle")
        .attr("class", "globalProfile")
        .attr("cx", Math.sin(angle) * rScale(globalVal))
        .attr("cy", -Math.cos(angle) * rScale(globalVal))
        .attr("r", 3)
        .attr("fill", "#666");
    });
  }
}

// VISUAL 10: Stacked Bar Chart of Daily Time Allocation
function renderTimeAllocation(data) {
  const svg = d3.select("#timeallocationchart");
  const margin = { top: 50, right: 30, bottom: 100, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  svg.selectAll("*").remove();

  svg.attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const timeCategories = [
  { key: "study", name: "Study", color: "#69b3a2" },
  { key: "sleep", name: "Sleep", color: "#f28e2b" },
  { key: "social", name: "Social Media", color: "#e15759" },
  { key: "netflix", name: "Netflix", color: "#76b7b2" },
  { key: "other", name: "Other", color: "#bab0ac" }
  ];

  // Calculate "other" category
  const processedData = data.map(d => {
    const tracked = timeCategories
      .filter(c => c.key !== "other")
      .reduce((sum, c) => sum + (d[c.key] || 0), 0);
    return {
      ...d,
      other: Math.max(0, 24 - tracked)
    };
  });

  // Define performance quartiles
  const examScores = processedData.map(d => d.exam).sort(d3.ascending);
  const q1 = d3.quantile(examScores, 0.25);
  const q2 = d3.quantile(examScores, 0.50);
  const q3 = d3.quantile(examScores, 0.75);

  const ranges = [
    { name: "Top 25%", range: [q3, 100] },
    { name: "51-75%", range: [q2, q3] },
    { name: "26-50%", range: [q1, q2] },
    { name: "Bottom 25%", range: [0, q1] }
  ];

  const groupedData = ranges.map(group => {
    const students = processedData.filter(d => d.exam >= group.range[0] && d.exam < group.range[1]);
    const avg = {};
    timeCategories.forEach(cat => {
      avg[cat.key] = d3.mean(students, d => d[cat.key]);
    });
    return {
      name: group.name,
      ...avg
    };
  });

  // Stack it
  const stack = d3.stack().keys(timeCategories.map(d => d.key));
  const stackedData = stack(groupedData);

  // Scales
  const x = d3.scaleBand()
    .domain(groupedData.map(d => d.name))
    .range([0, width])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, 24])
    .range([height, 0]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("x", -5)
    .attr("y", 10)
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-45)");

  g.append("g").call(d3.axisLeft(y).ticks(6));

  // Axis Labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .attr("text-anchor", "middle")
    .text("Performance Group (by Exam Score Quartile)");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .text("Hours per Day");

  // Bars
  const layer = g.selectAll(".layer")
    .data(stackedData)
    .enter().append("g")
    .attr("fill", d => timeCategories.find(c => c.key === d.key).color);

  layer.selectAll("rect")
    .data(d => d)
    .enter().append("rect")
    .attr("x", d => x(d.data.name))
    .attr("y", height)
    .attr("height", 0)
    .attr("width", x.bandwidth())
    .on("mouseover", function (e, d) {
      const category = timeCategories.find(c => c.key === this.parentNode.__data__.key);
      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`
          <strong>${category.name}</strong><br>
          Group: ${d.data.name}<br>
          Hours: ${(d[1] - d[0]).toFixed(1)}
        `)
        .style("left", `${e.pageX + 5}px`)
        .style("top", `${e.pageY - 28}px`);
    })
    .on("mouseout", () => d3.select("#tooltip").style("opacity", 0))
    .transition()
    .duration(800)
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]));

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${margin.left},${height + margin.top + 60})`);

  timeCategories.forEach((cat, i) => {
    const item = legend.append("g")
      .attr("transform", `translate(${i * 120}, 0)`);

    item.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", cat.color);

    item.append("text")
      .attr("x", 15)
      .attr("y", 10)
      .text(cat.name)
      .style("font-size", "10px");
  });
}