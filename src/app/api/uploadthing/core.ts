import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import {PDFLoader} from "langchain/document_loaders/fs/pdf"
// import { getPineconeClient } from '@/lib/pinecone'
import {pinecone} from '@/lib/pinecone'
import {OpenAIEmbeddings} from "langchain/embeddings/openai"
import {PineconeStore} from "langchain/vectorstores/pinecone"
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";

 
const f = createUploadthing();
  

const middleware = async()=> {

  const {getUser} = getKindeServerSession()

  const user = await getUser()
 
  if(!user || !user.id) throw new Error("Unauthorized") 

  const subscriptionPlan = await getUserSubscriptionPlan()

  return {subscriptionPlan, userId: user.id}

}

const onUploadComplete = async({
  metadata, file
}: {
  metadata: Awaited<ReturnType<typeof middleware>>
  file: {
    key: string,
    name: string,         //upload things provide us
    url: string,
  }
}) => {

  const isFileExist = await db.file.findFirst({     //dublication check
    where: {
      key: file.key,
    }
  })

  if (isFileExist) return 

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

    const {subscriptionPlan} = metadata
    // const {isSubscribed} = subscriptionPlan
    // Check if subscriptionPlan exists and has isSubscribed property
   const isSubscribed = subscriptionPlan && subscriptionPlan.isSubscribed;

   const isProExceeded = pagesAmt > PLANS.find((plan)=> plan.name === "Pro")!.pagesPerPdf
   const isFreeExceeded = pagesAmt > PLANS.find((plan)=> plan.name === "Free")!.pagesPerPdf

    if((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
     
      await db.file.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: createdFile.id,
        }
      })


    }

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

}
 

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  freePlanUploader: f({ pdf: { maxFileSize: "4MB" } })      //pdf ya kaisa bhi file jo upload user krega
   .middleware(middleware)
    .onUploadComplete(onUploadComplete),

  ProPlanUploader: f({ pdf: { maxFileSize: "16MB" } })      //pdf ya kaisa bhi file jo upload user krega
   .middleware(middleware)
    .onUploadComplete(onUploadComplete),




} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;