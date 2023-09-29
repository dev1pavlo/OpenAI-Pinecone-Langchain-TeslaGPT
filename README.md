# Deploy
Link: https://openai-tesla-gpt.fly.dev/
Note! I  limited number of requsts per day, because Open AI API is not free, and I do not want to get a huge check as this is just an example project.

# What is it
This is a chat with Tesla GPT bot. It can answer some of your questions about Tesla Inc. For storing vectors I used Free plan of vector database `Pinecone`.
To upload documents to that `Pinecone` database I use `Langchain`. I had to use it only once, to upload data, later it was not needed.
In process of uploading `.pdf` documents to `Pinecone` I had to transform that data into embeddings.
- First, documents are splitted into chunks
- For every chunk I used `Langchain` and `Open AI` embeddings to transform.
- Later data is splitted into batches of vectors and uploaded to `Pinecone`
- When the question is sent from client, it is also transformed to vector and sent to `Pinecone`
- Data is compared between question vector and `Pinecone` vectors
- Answer is generated and sent to client