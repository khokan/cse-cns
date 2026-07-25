
import { cookies } from "next/headers";
import { env } from "process";


const AUTH_API= env.AUTH_URL // To get env missing error

if (!AUTH_API) {
  console.warn("AUTH_URL environment variable is not set");
}

export const userService = {
    getSession: async function () {
        try{
                const cookiStore = await cookies();

                const res = await fetch(`${AUTH_API}/get-session`, 
                    {
                        headers: { Cookie: cookiStore.toString() },
                        cache: 'no-store'
                    });    

                if (!res.ok) {
                    return { data: null, error: { message: "session is missing" } };
                }

                const payload = await res.json();
                const session = payload?.user ? payload : payload?.data ?? null;

                if (!session?.user) {
                    return { data: null, error: { message: "session is missing" } };
                }

                return { data: session, error: null };    
            }
             catch(error){
                console.error(error)
                 return { data:null, error:{message: "something went wrong"} }; 
            }
}

}

  
 


