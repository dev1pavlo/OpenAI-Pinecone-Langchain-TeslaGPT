import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from 'langchain/llms/openai';
import { loadQAStuffChain } from 'langchain/chains';
import { Document } from "langchain/document";

export default async function queryGPT(
    client: Pinecone,
    indexName: string,
    question: string
) {
    const index = client.Index(indexName);

    console.log(question);

    const queryEmbedding = await new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY
    }).embedQuery(question);

    let queryResponse = await index.query({
        topK: 10,
        vector: queryEmbedding,
        includeMetadata: true,
        includeValues: true
    });
    console.log('Asked question: ', question);

    const llm = new OpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY
    })
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches.map(m => m.metadata.pageContent).join(" ");
    const result = await chain.call({
        input_documents: [new Document({ pageContent: concatenatedPageContent })],
        question
    });

    console.log('Answer: ', result);
    return result;
}