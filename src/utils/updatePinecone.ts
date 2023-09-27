import { type Pinecone } from "@pinecone-database/pinecone";
import { type Document } from "langchain/document";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import sleep from "./sleep";

export default async function (
    client: Pinecone,
    indexName: string,
    docs: Document<Record<string, any>>[]
) {
    console.log('Retrieving index from pinecon...');
    const index = client.Index(indexName);

    console.log(`Pinecone index retrieved ${indexName}`);

    for (const doc of docs) {
        console.log(`Processing document: ${doc.metadata.source}`);
        const path = doc.metadata.source;
        const text = doc.pageContent;

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000
        });
        console.log('Splitting text into chunks');
        const chunks = await textSplitter.createDocuments([text]);
        console.log(`Text splitted into ${chunks.length} chunks`);
        console.log(`Calling OpenAI's Embedding endpoint documents with chunks`);

        let embeddingsArrays;
        while(!embeddingsArrays) {
            try{
                embeddingsArrays = await new OpenAIEmbeddings({
                    openAIApiKey: process.env.OPENAI_API_KEY
                }).embedDocuments(
                    chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
                );
            } catch(e) {
                console.log('Failed to get embeddings. Retring in 10 seconds....');
                await sleep(10000);
            }
        }
        console.log('Finished embeddings');
        
        const batchSize = 100;
        let batch = [];
        for(let idx = 0; idx < chunks.length; idx++) {
            const chunk = chunks[idx];
            const vector = {
                id: `${path}_${idx}`,
                values: embeddingsArrays[idx],
                metadata: {
                    ...chunk.metadata,
                    loc: JSON.stringify(chunk.metadata.loc),
                    pageContent: chunk.pageContent,
                    txtPath: path
                }
            };

            batch.push(vector);

            if(batch.length === batchSize || idx === chunks.length - 1) {
                await index.upsert(batch);
                batch = [];
            }
        }
    }
}