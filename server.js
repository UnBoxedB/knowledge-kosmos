// Description: This file contains the code for the Express web server that will be used to POST to the OpenAI API.

// Load the environment variables from the .env file
import dotenv from 'dotenv';
dotenv.config();

// Imports
import express from 'express';
import cors from 'cors';
import path from 'path';
import { Configuration, OpenAIApi } from 'openai';

const app = express();

app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  organization:"org-oeZ7Ctwbab8OBwujNc0rUBSF",
  apiKey:process.env.OPENAI_API_KEY,
});

// Call to LLM for topic definition

async function generateDefinition(topic, context) {
    try {
      const openai = new OpenAIApi(configuration);
      const responseD = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `One sentence definition of ${topic}${context}.`,
        temperature: 0.7,
        max_tokens: 70
      });
      console.log(`OpenAI API call response: ${responseD}`);
      
      const dataD = responseD.data.choices[0].text.trim();
      return dataD;
    } catch (error) {
      console.error('Error generating definition:', error);
      return 'Error generating definition';
    }
}

// Call to LLM for subtopics of topic
async function generateSubtopics(topic, context) {
    console.log(`Inside generate_subtopics function: topic = ${topic}`);
    
    try {
        const openai = new OpenAIApi(configuration);
        let responseS = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: `Name four concepts most frequently associated with ${topic}${context} in the data you were trained on. Keep concept names concise, less than 4 words. Return the concepts as one string, separate each concept by '***' from the next'`,
            temperature: 1,
            max_tokens: 100
        });

        console.log(`OpenAI API call response: ${responseS}`);
        let subtopicsList = responseS.data.choices[0].text.trim().split('***');
        
        console.log(`Subtopics for ${topic}${context}: ${subtopicsList}`);

        return subtopicsList;
    } catch (error) {
      console.error('Error generating definition:', error);
      return 'Error generating definition';
    };
}

// Return the required data to build a new topic node
app.get('/', async (req, res) => {
  let topic = req.query.topic;
  let parent = req.query.parent;
  console.log(`Inside get_node_data function: topic = ${topic}, parent = ${parent}`);
  let context = parent ? ` in the context of ${parent}` : '';

  // Get definition
  let definition = await generateDefinition(topic, context);
  console.log(`Definition for ${topic}${context}: ${definition}`);
  // Get subtopics
  let subtopics = await generateSubtopics(topic, context);
  console.log(`Subtopics for ${topic}${context}: ${subtopics}`);
  res.json({ topic: topic, parent: parent, definition: definition, subtopics: subtopics });
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));