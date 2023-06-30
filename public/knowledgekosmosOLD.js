const graph = { nodes: [], links: [] };
const fixedWidth = 150; 
const fontSize = 12;  
const width = 900;
const height = 640;
let knowledgeKosmos;

//fetch definition and subtopics from API server
async function fetchTopicData(topic, parent) {
  try {
    const response = await fetch(`http://localhost:5000?topic=${topic}&parent=${parent || ''}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Data returned:' + typeof data + JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null; // return null in case of error
  }
};


    
function createChildren(graph, parent) {
    let parentsChildren = parent.children;
    let parentID = parent.id;
    let parentName = parent.topic
    for (let i = 0; i < parentsChildren.length; i++) {
        // create new topics
        const newChild = new Topic ( 
            `${parentID}.${i+1}`,
            parentsChildren[i],
            parentName,
            null,
            null,
            parentsChildren[i],
            true
        );
        graph.nodes.push(newChild);
        //create new links to (this) parent node
        const newLink = { source: `${parentID}`, target: `${parentID}.${i+1}`};
        console.log (newLink);
        graph.links.push(newLink);
    }
    knowledgeKosmos.update(graph);
};





knowledgeKosmos = function createKnowledgeKosmos(graph){
  
  //d3.select('#kosmos').selectAll('*').remove();

  const svg = d3.select('#kosmos').append('svg');

  svg.attr("width", width).attr("height", height).attr("viewBox", [-width / 2, -height / 2, width, height]);

  const simulation = d3.forceSimulation()
      .force("charge", d3.forceManyBody().strength(-500))
      .force("link", d3.forceLink().id(d => d.id).distance(200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

  let link = svg.append("g")
      .attr('class', 'links')
    .selectAll("line");

  let node = svg.append("g")
      .attr('class', 'nodes')
      .selectAll("g");

  function ticked() {
    node.attr("transform", (d) => "translate(" + d.x + "," + d.y + ")");

    link.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
  }

  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
  
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
  
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  
    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  return {
    update({nodes, links}) {

      // Make a shallow copy to protect against mutation, while
      // recycling old nodes to preserve position and velocity.
      const old = new Map(node.data().map(d => [d.id, d]));
      nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d));
      links = links.map(d => Object.assign({}, d));

      simulation.nodes(nodes);
      simulation.force("link").links(links);
      simulation.alpha(1).restart();

      link = link
        .data(links, d => `${d.source.id}\t${d.target.id}`)
        .join("line");

      node = node
        .data(nodes, d => d.id)
        .join(enter => enter.append('g'));
      
      node.append("rect")
        .attr("class", "rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", fixedWidth) 
        .attr("height", (d) => computeTextBlockHeight(d.displayText, fixedWidth, fontSize));
        // ADD THIS LATER .attr("fill", function(d) { return color(d.group); });
        
      // Append text to the group
      node.append("text")
            .attr("class", "text")
        .attr("x", 10)
        .attr("y", 10) // Add padding
        .attr("dy", ".35") // CHECK THIS LATER 
        .attr("font-size", fontSize)
        .text((d) => d.displayText)
        .call(wrap, fixedWidth);
      
      node.call(drag(simulation));
      
      node.filter((d) => !d.definition)
        .on('dblclick', (event, d) => {
          handleTopicClick(graph, d.id, d.topic, d.parent);
        });
    }
  }  
};
function Topic (id, topic, parent, children, definition, text, clickable) {
  this.id = id; // "1" for root node, "1.1" for child node, "1.1.1" for grandchild node
  this.topic = topic;  // topic name
  this.parent = parent;  // parent topic name
  this.children = children; // array of child topic names, null if no children
  this.definition = definition // topic definition, null if no children
  this.displayText = text; // ==> definition, topic if no children
  this.clickable = clickable; // false, true if no children
  //console.log('Topic:', this.id, this.topic, this.parent, this.children, this.definition, this.displayText, this.clickable)
};




function handleTopicClick(graph, locator, topic, parent) {
  fetchTopicData(topic, parent).then((data) => {
    if (data) {
      graph.nodes.find(x => x.id === locator).children = data.subtopics;
      graph.nodes.find(x => x.id === locator).definition = data.definition;
      graph.nodes.find(x => x.id === locator).displayText = data.definition;
      graph.nodes.find(x => x.id === locator).clickable = false;
      let topicRecord = graph.nodes.find(x => x.id === locator);
      createChildren(graph, topicRecord);
      //console.log('In handleTopicClick, graph: ' + graph.nodes + graph.links);
    }
  });
}
/*
function buildRootTopic (graph, topic){
  const data = await fetchTopicData(topic, null);
      // build root topic and root node
      const rootTopic = new Topic(
        "1",
        topic,
        null,
        null,
        null,
        null,
        null
      );
      graph.nodes.push(rootTopic);
      return rootTopic;
};



// listen for root topic from user
document.getElementById("searchForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const searchTerm = document.getElementById('searchTerm');
    const topic = searchTerm.value.trim();
    if (topic) {
      userTopic = buildRootTopic(graph, topic);
      knowledgeKosmos.update(updateTopic(buildRootTopic(topic)));
    }
})};
*/
