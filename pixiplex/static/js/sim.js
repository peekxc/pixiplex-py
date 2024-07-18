import {forceSimulation, forceCollide, forceManyBody, forceY, forceX} from "https://cdn.skypack.dev/d3-force@3"

const plt = Bokeh.Plotting;
class Node {
  constructor(index, x, y, color, radius) {
    this.index = index
    this.x = x
    this.y = y
    this.color = color
    this.radius = radius
  }
}
// set up some data
const M = 30
let xx = []
let yy = []
const colors = []
const radii = []
let nodes = []
for (let y = 0, i = 0; y <= M; y += 4) {
    for (let x = 0; x <= M; x += 4, i += 1) {
        const node = new Node(i, x, y, plt.color([50+2*x, 30+2*y, 150]),
                              Math.random()+0.5)
        nodes.push(node)
        xx.push(node.x)
        yy.push(node.y)
        colors.push(node.color)
        radii.push(node.radius)
    }
}
const nodes_initial = JSON.parse(JSON.stringify(nodes))

function update_coordinates() {
  xx = []
  yy = []
  for (const node of nodes) {
    xx.push(node.x)
    yy.push(node.y)
  }
  source.data.x = xx
  source.data.y = yy
}

// create a data source
let source = new Bokeh.ColumnDataSource({
    data: { x: xx, y: yy, radius: radii, colors: colors }
})

const xr = new Bokeh.Range1d({start: 0, end: 30})
const yr = new Bokeh.Range1d({start: 0, end: 30})
// make the plot and add some tools
const tools = "pan,crosshair,wheel_zoom,box_zoom,reset,save";

const p = document.getElementById("sim_figure")
console.log(p)
const q = plt.figure({
  title: "D3 Force Used on Bokeh Plot",
  x_range: xr,
  y_range: yr,
  tools: tools 
});
console.log(q)

const circles = p.circle({ field: "x" }, { field: "y" }, {
    source: source,
    radius: radii,
    fill_color: { field: "colors" },
    fill_alpha: 0.6,
    line_color: null,
    radius_units: "data"
});

// show the plot
plt.show(p);
const POS_STRENGTH = 0.04
const COL_STRENGTH = 0.6
const simulation = forceSimulation(nodes)
    .force('x', forceX().strength(POS_STRENGTH).x(15))
    .force('y', forceY().strength(POS_STRENGTH).y(15))
    .force('collision', forceCollide().strength(COL_STRENGTH).radius(d => d.radius))
    .on('tick', ticker)

function ticker() {
  update_coordinates()
  source.change.emit()
}

const btn = document.getElementById("restart")
btn.addEventListener("click", () => {
   for (let i=0; i<nodes.length; i+=1) {
    nodes[i]['x'] = nodes_initial[i]['x']
    nodes[i]['y'] = nodes_initial[i]['y']
  }
  
  update_coordinates()
  source.change.emit()
  simulation.alpha(1).restart()
})