import path from 'node:path';
// import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { config } from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import createPineconeIndex from './utils/createPineconeIndex';
// import updatePinecone from './utils/updatePinecone';
import queryGPT from './utils/queryGPT';
import express from 'express';

config();
const app = express();
app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'public')))

const requestCounts = new Map();

const MAX_REQUESTS = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

app.use((req, res, next) => {
    const clientIP = req.socket.remoteAddress || req.headers['X-Forwarded-For']; // Assuming Express automatically parses the IP

    if (!requestCounts.has(clientIP)) {
        requestCounts.set(clientIP, { count: 0, lastRequestTime: Date.now() });
    }

    const record = requestCounts.get(clientIP);
    const elapsedTime = Date.now() - record.lastRequestTime;

    if (elapsedTime > WINDOW_MS) {
        // Reset count if more than one day has passed
        record.count = 0;
        record.lastRequestTime = Date.now();
    }

    if (record.count < MAX_REQUESTS) {
        record.count++;
        requestCounts.set(clientIP, record);
        next();
    } else {
        res.status(429).json({
            answer: 'Ooops... Sorry, this GPT uses Open AI API that is not free, so we provided a limit for 3 requests per day. You can try again tomorrow'
        });
    }
});

app.post('/api/gpt', async (req, res) => {
    const { question } = req.body;

    // === This code was needed to upload index in pipecone ===
    // const pathToFile = path.resolve(__dirname, '..', 'data', 'tesla2022_table.pdf');
    // const loader = new PDFLoader(pathToFile);
    // const docs = await loader.load();

    // const question = 'What was Net income in 2022 in Tesla, Inc.?';
    const indexName = 'test-index';
    const vectorDimension = 1536; // OpenAI

    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API,
        environment: process.env.PINECONE_ENV
    })

    await createPineconeIndex(pinecone, indexName, vectorDimension);
    // === This code was needed to upload index in pipecone ===
    // await updatePinecone(pinecone, indexName, docs);

    const { text } = await queryGPT(pinecone, indexName, question);

    res.json({
        answer: text,
        question
    })
})

app.listen(3000, () => {
    console.log('Server is running!');

});
export default app;