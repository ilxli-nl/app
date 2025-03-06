"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from '@/components/ui/pagination'


  const Paginations  = ({page})  => {


    //const InfiniteOrders = ()  => {
  

          const router = useRouter()
          const searchParams = useSearchParams()
        
          const page2 = searchParams.get('page') ?? '1'
      

  //  }


    return (
  
            <Pagination>
            <PaginationContent>
                <PaginationItem>
                <PaginationPrevious  href="#" onClick={() => {
          router.push(`?page=${Number(page2) - 1}`)
        }} />
                </PaginationItem>
                <PaginationItem>
                <PaginationLink >{page2} </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                <PaginationNext href="#" onClick={() => {
          router.push(`?page=${Number(page2) + 1}`)
        }}/>
                </PaginationItem>
            </PaginationContent>
            </Pagination>
  
    );
 
}
  export default Paginations;