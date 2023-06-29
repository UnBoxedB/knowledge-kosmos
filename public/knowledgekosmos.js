const graph = { nodes: [], links: [] };
const fixedWidth = 150; // Set the fixed width for the text boxes
const fontSize = 12;  
const width = 900;
const height = 640;

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
    
function createChildren(parent) {
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
};

// Compute number of lines needed to fit text
function computeTextBlockHeight(text, maxWidth, fontSize) {
  console.log(`Input to computeTextBlockHeight: text=${text}, maxWidth=${maxWidth}, fontSize=${fontSize}`);

  const words = text.split(" ");
  let line = [];
  let lineNumber = 0;
  const lineHeight = 1.1; // ems

  const tempSvg = d3.create("svg").style("position", "absolute").style("visibility", "hidden");
  document.body.appendChild(tempSvg.node());
  const tempText = tempSvg.append("text").style("font-size", `${fontSize}px`);

  words.forEach((word) => {
    line.push(word);
    tempText.text(line.join(" "));
    const computedLength = tempText.node().getComputedTextLength();
    //console.log(`Word: ${word}, Line: ${line.join(" ")}, Computed length: ${computedLength}`);
    if (computedLength > maxWidth) {
      line.pop();
      tempText.text(line.join(" "));
      line = [word];
      lineNumber++;
      //console.log(`Line number incremented to ${lineNumber}`);
    }
  });

  // Add 1 to lineNumber if there are remaining words in the line
  if (line.length > 0) {
    lineNumber++;
  }

  tempSvg.remove();
  //console.log(`Final line number: ${lineNumber}`);
  const textHeight = lineNumber * fontSize * lineHeight;
  //console.log(`Computed height for text: ${textHeight}`);

  return textHeight;
};

//Wrap text in boxes of set width
function wrap(text, width) {
  text.each(function() {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.1; // ems
      const x = text.attr("x");
      const y = text.attr("y");
      const dy = parseFloat(text.attr("dy")) || 0;
      let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

      while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > (width-20)) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              //tspan = text.append("tspan").attr("x", x).attr("y", function() { return lineNumber * lineHeight * fontSize; }).text(word);
              tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", (++lineNumber * lineHeight + dy) + "em").text(word);
          }
      }
  });
};

function handleTopicClick(locator, topic, parent) {
  fetchTopicData(topic, parent).then((data) => {
    if (data) {
      graph.nodes.find(x => x.id === locator).children = data.subtopics;
      graph.nodes.find(x => x.id === locator).definition = data.definition;
      graph.nodes.find(x => x.id === locator).displayText = data.definition;
      graph.nodes.find(x => x.id === locator).clickable = false;
      let topicRecord = graph.nodes.find(x => x.id === locator);
      createChildren(topicRecord);
      //console.log('In handleTopicClick, graph: ' + graph.nodes + graph.links);
    }
  });
}

function createKnowledgeKosmos(){
  
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
        .attr("dy", ".35em") // CHECK THIS LATER 
        .attr("font-size", fontSize)
        .text((d) => d.displayText)
        .call(wrap, fixedWidth);
      
      node.call(drag(simulation));
      
      node.filter((d) => !d.definition)
        .on('dblclick', (event, d) => {
          handleTopicClick(d.id, d.topic, d.parent);
          update(graph);
        });


    }
  }  
};

// get root topic from user
document.getElementById("searchForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const searchTerm = document.getElementById('searchTerm');
    const topic = searchTerm.value.trim();
    if (topic) {
      const data = await fetchTopicData(topic, null);
      // build root topic and root node
      const rootTopic = new Topic(
        "1",
        data.topic,
        null,
        data.subtopics,
        data.definition,
        data.definition,
        false
      );
      graph.nodes.push(rootTopic);
      // create root topic's children and related nodes and links
      createChildren(rootTopic);
    }
    knowledgeKosmos.update(graph);}
  );


/*
function createForceLayout(graphData) {
    console.log(graph);
    const nodes = graphData.nodes;
    const links = graphData.links;
    console.log (graphData.nodes);
    console.log (graphData.links);
    console.log (nodes);
    console.log (links);
    
    
  
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(200))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
  
    d3.select('#kosmos').selectAll('*').remove();

    const svg = d3.select('#kosmos').append('svg')
        .attr('width', width)
        .attr('height', height);

    const link = svg.append('g')
        .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link');
  
    const node = svg.append('g')
        .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(drag(simulation));
      
    node.append("rect")
      .attr("class", "rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", fixedWidth) 
      .attr("height", (d) => computeTextBlockHeight(d.displayText, fixedWidth, fontSize) + 10);
      // ADD THIS LATER .attr("fill", function(d) { return color(d.group); });
      
    // Append text to the group
    node.append("text")
          .attr("class", "text")
      .attr("x", 10)
      .attr("y", 10 + fontSize) // Add padding
      .attr("dy", 0)
      .attr("font-size", fontSize)
      .text((d) => d.displayText)
      .call(wrap, fixedWidth);  
      
    node.filter((d) => !d.definition)
      .on('dblclick', (event, d) => handleTopicClick(d.id, d.topic, d.parent));
  
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
  
      node
      .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")"); 
    });
}

function handleTopicClick(locator, topic, parent) {
    fetchTopicData(topic, parent).then((data) => {
      if (data) {
        let topicRecord = graph.nodes.find(x => x.id === locator);
        topicRecord.children = data.subtopics;
        topicRecord.definition = data.definition;
        topicRecord.displayText = data.definition;
        topicRecord.clickable = false;
        createChildren(topicRecord);
        console.log('In handleTopicClick, graph: ' + graph.nodes + graph.links);
        createForceLayout(graph);
      }
    });
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
}*/
  //invalidation.then(() => simulation.stop());
/*
update({nodes, links}) {

  const old = new Map(node.data().map(d => [d.id, d]));
  nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d));
  links = links.map(d => Object.assign({}, d));

  simulation.nodes(nodes);
  simulation.force("link").links(links);
// update link
link = link.data(links, d => [d.source, d.target]);
link.exit().remove();
link = link.enter().append('line').merge(link);

// update node
node = node.data(nodes, d => d.id);
node.exit().remove();
const nodeEnter = node.enter().append("g");

node = nodeEnter.merge(node);

// Define the nodes
nodeEnter.append("rect")
    .attr("class", "nodes")
    .attr("width", fixedWidth)
    .attr("height", (d) => computeTextBlockHeight(d.displayText, fixedWidth, fontSize))
    .attr("fill", "white")
    .attr("stroke", "steelblue")
    .attr("rx", 5)
    .attr("ry", 5);

nodeEnter.append("text")
    .attr("x", 10)
    .attr("y", 10)
    .attr("dy", ".35em")
    .text((d) => d.displayText)
    .style("fill", (d) => d.clickable ? "blue" : "black")
    .style("font-size", `${fontSize}px`)
    .style("cursor", (d) => d.clickable ? "pointer" : "default")
    .call(wrap, fixedWidth)
    .on('click', (event, d) => {
      if (d.clickable) {
        handleTopicClick(d.id, d.topic, d.parent);
      }
    });

node.call(drag(simulation));

simulation.alpha(1).restart();
}
};
}
*/

