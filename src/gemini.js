import 'dotenv/config';
import { VertexAI } from '@google-cloud/vertexai';

const vertex = new VertexAI({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  location : 'us-central1'
});

export const gemini = vertex.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.7,
    topP: 0.95
  }
});


