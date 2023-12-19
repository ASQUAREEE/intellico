import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { privateProcedure, publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
import {z} from "zod"
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
import { absoluteUrl } from '@/lib/utils';
import { getUserSubscriptionPlan, stripe } from '@/lib/stripe';
import { PLANS } from '@/config/stripe';
 
export const appRouter = router({

//   test: publicProcedure.query(()=> {

// //  return new Response(JSON.stringify(""))
//  return 'hello'
// //  return 5

  // })

 authCallback: publicProcedure.query( async ()=> {

 const {getUser} = getKindeServerSession();
 const user = await getUser();

 if(!user || !user.id || !user.email) 
   throw new TRPCError({code:"UNAUTHORIZED"})


 // check if the user is in the database

 const dbUser = await db.user.findFirst({
where: {
  id: user.id
}
 })


 if(!dbUser) {

   // create user in db
   await db.user.create({ 
 data: {
    id: user.id,
    email: user.email
  }

   })
 }
  return {success: true}

 }),

 getUserFiles: privateProcedure.query(async ({ctx}) => {
   const {userId} = ctx
   

   return await db.file.findMany({
   
    where: {
     userId
    }

   })
 

 }),

 createStripeSession: privateProcedure.mutation(async({ctx})=>{

const {userId} = ctx

const billingurl = absoluteUrl("/dashboard/billing")

if(!userId) throw new TRPCError({code:"UNAUTHORIZED"}) 

const dbUser = await db.user.findFirst({

where: { 
  id: userId, 
}

})

if(!dbUser) throw new TRPCError({code:"UNAUTHORIZED"}) 


const subscriptionsPlan = await getUserSubscriptionPlan()

if(subscriptionsPlan.isSubscribed && dbUser.stripeCustomerId) {
  const stripeSession = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId, 
    return_url: billingurl
  })

  return {url: stripeSession.url}
}

const stripeSession =  await stripe.checkout.sessions.create({
  success_url: billingurl,
  cancel_url: billingurl,
  payment_method_types: ["card","paypal","us_bank_account"],
  mode: "subscription",
  billing_address_collection: "auto",
  line_items: [

    {
      price: PLANS.find((plan)=> plan.name === "Pro" )?.price.priceIds.test,
      quantity: 1
    }],
      metadata: {
        userId: userId,
      }
})

return {url: stripeSession.url}


 }),

 getFileUploadStatus: privateProcedure.input(z.object({fileId: z.string()}))
 .query(async ({input, ctx})=>{

const file = await db.file.findFirst({

where: {
  id: input.fileId,
  userId: ctx.userId,
}
})

if(!file) return {status: "PENDING" as const}         //schema.prisma m pending dekho

return {status: file.uploadStatus}

 }),

 getFile: privateProcedure.input(z.object({key: z.string()}))
 .mutation(async({ctx,input})=> {

const {userId} = ctx

const file = await db.file.findFirst({ 

  where: {

 key: input.key,
 userId

  },

})

if(!file) throw new TRPCError({code: "NOT_FOUND"})

return file



 }),

 getFileMessages: privateProcedure.input(
 z.object({
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),   //if we use nullish then we do not have to pass this
  fileId: z.string()
 }
 )).query(async({ctx,input})=>{
 const {userId} = ctx
 const {fileId, cursor} = input
 const limit =  input.limit ?? INFINITE_QUERY_LIMIT

 const file = await db.file.findFirst({
 where: {
  id: fileId,
  userId
 }
 })

 if(!file) throw new TRPCError({code:"NOT_FOUND"})

 const messages = await db.message.findMany({
  take: limit + 1,  //one extra elem is going to cursor
  where: {
    fileId
  },
  orderBy: {
    createdAt: "desc",
  },

  cursor: cursor ? {id: cursor}: undefined,
  select:{
    id:true,
    isUserMessage:true,
    createdAt: true,
    text: true
  }

 })




 let nextCursor: typeof cursor | undefined = undefined
 if(messages.length> limit) {
  const nextItem = messages.pop()
  nextCursor = nextItem?.id

 }

 return {
  messages,
  nextCursor
 }

 }),


 deleteFile: privateProcedure.input(
  
  z.object({id: z.string()})
 
 
 ).mutation(async({ctx, input})=>{            //input upar wala id agar 2 hota to 2

const {userId} = ctx

const file = await db.file.findFirst({
where: {
id: input.id,
userId,

}
})
if (!file) throw new TRPCError({code:"NOT_FOUND"})

await db.file.delete({


where:{
id:input.id,
},
})

return file

 }),



});



// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;