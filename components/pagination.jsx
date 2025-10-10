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
import { useCallback } from 'react'

const Paginations = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const page = Number(searchParams.get('page')) || 1
    const isFirstPage = page <= 1

    // Memoized navigation handler
    const navigateToPage = useCallback((newPage) => {
        if (newPage < 1) return // Prevent negative pages
        
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        
        router.push(`?${params.toString()}`, { scroll: false })
    }, [router, searchParams])

    const handlePrevious = useCallback(() => {
        if (!isFirstPage) {
            navigateToPage(page - 1)
        }
    }, [isFirstPage, page, navigateToPage])

    const handleNext = useCallback(() => {
        navigateToPage(page + 1)
    }, [page, navigateToPage])

    return (
        <Pagination aria-label="Orders pagination">
            <PaginationContent>
                {/* Previous Button */}
                <PaginationItem>
                    <PaginationPrevious 
                        onClick={handlePrevious}
                        className={
                            isFirstPage 
                                ? "pointer-events-none opacity-50 cursor-not-allowed" 
                                : "cursor-pointer hover:bg-gray-100 transition-colors"
                        }
                        aria-disabled={isFirstPage}
                        tabIndex={isFirstPage ? -1 : 0}
                    />
                </PaginationItem>

                {/* Current Page */}
                <PaginationItem>
                    <PaginationLink 
                        isActive
                        className="cursor-default"
                        aria-current="page"
                    >
                        {page}
                    </PaginationLink>
                </PaginationItem>

                {/* Page Info (Optional - shows total if available) */}
                <PaginationItem>
                    <PaginationEllipsis 
                        aria-label="More pages available" 
                    />
                </PaginationItem>

                {/* Next Button */}
                <PaginationItem>
                    <PaginationNext 
                        onClick={handleNext}
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}

export default Paginations