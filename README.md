# pixiplex_py

*Under construction*


# Performance 

per-node (laptop): 25-30 fps
group (laptop): 25-30 fps 
mesh (laptop): 25-30 fps
WebGL (laptop): 25-30 fps

It seems to be CPU bound 


# Graph API chain examples

```js
pp.graph().count()
pp.graph().nodes().count()
pp.graph().nodes().ids().slice(0, 10)
pp.graph().nodes([1, 2, 3]).count()
pp.graph().nodes([1, 9999]).ids()
pp.graph().neighbors([1], 2).count()
pp.graph().neighbors([1], 2, { direction: "out" }).count()
pp.graph().subgraph({ groups: [1] }).count()
pp.graph().nodes([1]).neighbors(2).count()
pp.graph().nodes([1]).neighbors(2, { shell: true }).count()
pp.graph().nodes([1, 2]).components().count()
pp.graph().nodes([1, 2]).components({ mode: "list" }).map((sel) => sel.count())
pp.graph().nodes([1]).any_path_to(10).ids()
pp.graph().nodes([1]).shortest_path_to(10).ids()
pp.graph().nodes([1]).shortest_path_to(10, { weighted: true, weight_key: "weight" }).ids()
pp.graph().nodes().where((n) => Number(n.score || 0) > 0.8).count()
pp.graph().nodes().where((n) => n.group === 1).attr({ flagged: true }).count()
pp.graph().nodes().where((n) => n.group === 1).style({ color: 0xff5500, radius: 8 }).count()
pp.graph().nodes([1]).edges().count()
pp.graph().nodes([1, 2, 3]).edges({ relation: "induced" }).count()
pp.graph().nodes([1, 2]).boundary().count()
pp.graph().nodes([1, 2]).cut(pp.graph().nodes([3, 4])).count()
pp.graph().nodes().where((n) => n.group === 1).to_array().length
pp.graph().nodes().where((n) => n.group === 1).to_object().nodes.length
pp.graph().edges().where((e) => Number(e.weight || 0) > 1).count()
pp.graph().edges().where((e) => Number(e.weight || 0) > 1).nodes().count()
pp.graph().edges().where((e) => Number(e.weight || 0) > 1).attr({ heavy: true }).count()
pp.graph().edges().where((e) => Number(e.weight || 0) > 1).to_array().length
pp.graph().edges().where((e) => Number(e.weight || 0) > 1).to_object().links.length
pp.graph().nodes([1, 2]).cut().nodes().to_array().map((n) => n.id)
pp.graph().merge({ nodes: [{ id: "temp-node" }], links: [] }).count()
pp.graph().nodes(["temp-node"]).remove().count()
pp.graph().normalize().validate()
pp.graph().reindex({ offset: 100 }).count()
pp.graph().clear().count()
```
