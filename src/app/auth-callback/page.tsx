"use client"


import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "../_trpc/client";
import { Loader } from "lucide-react";

const Page =  () => {

     const router = useRouter();

     const searchParams = useSearchParams();

     const origin = searchParams.get('origin');


     // const apiResponse = await fetch('/api/whatever');
     // const data = await apiResponse.json();           // data is any typescript is really very bad

     
      // const {data, isLoading} = trpc.authCallback.useQuery(undefined, {

      // this query runs on pageload
       trpc.authCallback.useQuery(undefined, {

        onSuccess: ({success}) =>{

          if(success){
               //user is synced to the db
               router.push(origin ? `/${origin}` : '/dashboard');
          }


        },


        onError: (error) => {

        if(error.data?.code === "UNAUTHORIZED") {

      router.push("/sign-in");

        }

        },
 
      retry: true,

      retryDelay: 500,


      })


      return (
      
        <div className="w-full mt-24 flex justify-center">
        
        <div className="flex flex-col items-center gap-2">

        <Loader className="h-8 w-8 animate-spin text-zinc-800" />

        <h3 className="font-semibold text-xl">Setting up your account...</h3>
        <p>You will be redirected automatically.</p>        
 

        </div>


        </div>

)

}

export default Page;