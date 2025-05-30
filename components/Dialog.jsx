
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { prisma } from '@/prisma';

const Dialog = () => {
  return (
    <div>
    <Dialog>
                    <DialogContent className='bg-yellow-50'>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                     <DialogTrigger>Open</DialogTrigger>
                  </Dialog>
    </div>
  )
}

export default Dialog
