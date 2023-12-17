import { Pinecone } from "@pinecone-database/pinecone";

export const pinecone = new Pinecone({
    environment: "gcp-starter",
  apiKey: process.env.PINECONE_API_KEY!,
//   environment: "us-west4-gcp-free",
  
});
// // const index = pinecone.Index("intellico");


// // import { PineconeClient } from '@pinecone-database/pinecone'

// // export const getPineconeClient = async () => {
// //   const client = new PineconeClient()

// //   await client.init({
// //     apiKey: process.env.PINECONE_API_KEY!,
// //     environment: 'us-east1-gcp',
// //   })

// //   return client
// // }


