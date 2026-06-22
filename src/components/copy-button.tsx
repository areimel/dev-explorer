import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type CopyButtonProps = {
  text: string
  title?: string
  className?: string
}

export function CopyButton({
  text,
  title = 'Copy to clipboard',
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      className={cn('size-7', className)}
      onClick={(e) => {
        e.stopPropagation()
        void handleCopy()
      }}
      title={title}
    >
      {copied ? <Check className='size-3.5' /> : <Copy className='size-3.5' />}
      <span className='sr-only'>{copied ? 'Copied' : title}</span>
    </Button>
  )
}
