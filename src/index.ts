import path from 'node:path';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { config } from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import createPineconeIndex from './utils/createPineconeIndex';
import updatePinecone from './utils/updatePinecone';
import queryGPT from './utils/queryGPT';

config();

(async () => {
    const pathToFile = path.resolve(__dirname, '..', 'data', 'tesla2022_table.pdf');
    const loader = new PDFLoader(pathToFile);
    const docs = await loader.load();

    const question = 'What was Gross profit in 2022 in Tesla, Inc.?';
    const indexName = 'test-index';
    const vectorDimension = 1536; // OpenAI

    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API,
        environment: process.env.PINECONE_ENV
    })

    await createPineconeIndex(pinecone, indexName, vectorDimension);
    // await updatePinecone(pinecone, indexName, docs);
    await queryGPT(pinecone, indexName, question);
})()
