import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import {PDFLoader} from "langchain/document_loaders/fs/pdf"
// import { getPineconeClient } from '@/lib/pinecone'
import {pinecone} from '@/lib/pinecone'
import {OpenAIEmbeddings} from "langchain/embeddings/openai"
import {PineconeStore} from "langchain/vectorstores/pinecone"

 
const f = createUploadthing();
 

 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })      //pdf ya kaisa bhi file jo upload user krega
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {

      const {getUser} = getKindeServerSession()

      const user = await getUser()
     
      if(!user || !user.id) throw new Error("Unauthorized") 

      return {userId: user.id}


      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      const createdFile = await db.file.create({
       
        data: {
          key: file.key,
          name: file.name,
          userId: metadata.userId,
          url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,            //instead of file.url bcoz it somethimes fails
          uploadStatus: 'PROCESSING'
        }
      })

      try {
        const response = await fetch (`https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`)
        const blob = await response.blob();
        const loader = new PDFLoader(blob)   // now we have loaded pdf into memory
        const pageLevelDocs = await loader.load();

        const pagesAmt = pageLevelDocs.length

        //vectorise and index entire document
           // vectorize and index entire document
          // const pinecone = await getPineconeClient()
          console.log("hehe debugging")
          

        const  pineconeIndex = pinecone.Index("intellico")   //jo pinecone mm name h
        
        
        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY
        })


       await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
        pineconeIndex,
        namespace: createdFile.id
       })

       await db.file.update({
        data:{
          uploadStatus:"SUCCESS",
        },
        where: {
          id: createdFile.id,
        }
       })


      } catch (error) {

     
        
        await db.file.update({ 

          data:{
            uploadStatus:"FAILED",
          },
          where: {
            id: createdFile.id,
          }


         })


      }

    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;