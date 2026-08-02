import { DataTableDemo } from "@/components/modules/common/data-table-generic";
import { Footer } from "@/components/shared/footer";
import Navbar from "@/components/shared/navbar";


export const dynamic = "force-dynamic";

export default function HomePageMain() {  
    return (
            <>
              <Navbar /> 
              <DataTableDemo />
               <Footer />
            </>)
}   