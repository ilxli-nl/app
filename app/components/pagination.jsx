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


  const Paginations  = ()  => {


    //const InfiniteOrders = ()  => {
  

          const router = useRouter()
          const searchParams = useSearchParams()
        
          const page = searchParams.get('page') ?? '1'
      

  //  }


    return (
  
            <Pagination>
            <PaginationContent>
                <PaginationItem>
                <PaginationPrevious className={page <= 1 ? "pointer-event-none opacity-50 disabled" : undefined}  onClick={() => {
          router.push(`?page=${Number(page) - 1}`)
        }} />
                </PaginationItem>
                <PaginationItem>
                <PaginationLink >{page} </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                <PaginationNext href="#" onClick={() => {
          router.push(`?page=${Number(page) + 1}`)
        }}/>
                </PaginationItem>
            </PaginationContent>
            </Pagination>
  
    );
 
}
  export default Paginations;