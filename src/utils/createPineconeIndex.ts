import { type Pinecone } from "@pinecone-database/pinecone";

export default async function createPineconeIndex(
    client: Pinecone,
    indexName: string,
    vectorDimension: number
) {
    console.log(`Checking if index exists`);
    const exist = await client.listIndexes()
    console.log(exist);
    if(exist.some(i => i.name === indexName)) {
        console.log('Index already exists');
        return
    }
    
    const createdIndex = await client.createIndex({
        name: indexName,
        dimension: vectorDimension,
        metric: 'cosine',
        waitUntilReady: true
    })
    return createdIndex
}