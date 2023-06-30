knowledge-kosmos

Explore concepts in an expandable definition + subtopics knowledge graph

This project creates an interactive visualization for exploring concepts and their definitions. Users enter a topic or concept, and the visualization displays its definition along with related subtopics. Users can click to expand subtopics and continue exploring.

Data is generated using OpenAI's API to get definitions and related topics for a given input. The visualization is built using D3.js for the force-directed graph layout.

How it works
Users enter a topic or concept in the search box, e.g. "abundance"

The topic is sent to an Express server, which calls OpenAI's API to get a definition and list of related subtopics for that topic.

The definition and subtopics are returned to the frontend, where a root node is created for the topic. Child nodes are created for each subtopic.

D3.js is used to create a force-directed graph visualization, with the root node at the center and child nodes surrounding it. Links connect the root node to each child.

Users can click on any node to expand it and see its definition and subtopics. New child nodes and links are added to the visualization.

Users can continue exploring by clicking on additional nodes to expand the graph.

Tech stack
D3.js for visualization and force-directed graph layout
Express and Node.js for server
OpenAI API for natural language generation of definitions and related topics
Future features
Improve styling and add zoom/pan features
Cache API responses to improve performance
Add search to jump to any topic
Customize number of subtopics returned
Allow re-centering the graph on any node
