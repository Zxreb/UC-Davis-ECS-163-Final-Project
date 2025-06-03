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

  // Draw all lines
  g.selectAll("path")
    .data(data)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", d => color(d.exam))
    .attr("stroke-width", 1.2)
    .attr("stroke-opacity", 0.5)
    .on("mouseover", function (e, d) {
      // Fade all lines
      g.selectAll("path").transition().duration(100)
        .attr("stroke-opacity", 0.1);

      // Highlight hovered line
      d3.select(this)
        .raise()
        .transition().duration(100)
        .attr("stroke-width", 3)
        .attr("stroke-opacity", 1)
        .attr("stroke", "#000");

      // Tooltip
      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`Exam Score: ${d.exam.toFixed(1)}`)
        .style("left", `${e.pageX + 5}px`)
        .style("top", `${e.pageY - 28}px`);
    })
    .on("mouseout", function () {
      // Reset all lines
      g.selectAll("path")
        .transition().duration(200)
        .attr("stroke-width", 1.2)
        .attr("stroke-opacity", 0.5)
        .attr("stroke", d => color(d.exam));

      // Hide tooltip
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