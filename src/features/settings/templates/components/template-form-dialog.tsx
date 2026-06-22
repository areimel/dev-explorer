import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useTemplatesStore } from '@/stores/templates-store'
import type { Template } from '@/lib/tauri/types'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  repoUrl: z.string().min(1, 'Repository URL is required'),
  description: z.string(),
  language: z.string(),
  tags: z.string(),
})

type FormValues = z.infer<typeof schema>

type TemplateFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  template?: Template
}

const EMPTY: FormValues = {
  name: '',
  repoUrl: '',
  description: '',
  language: '',
  tags: '',
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  mode,
  template,
}: TemplateFormDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && template) {
        form.reset({
          name: template.name,
          repoUrl: template.repoUrl,
          description: template.description,
          language: template.language ?? '',
          tags: template.tags.join(', '),
        })
      } else {
        form.reset(EMPTY)
      }
    }
  }, [open, mode, template, form])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      repoUrl: values.repoUrl,
      description: values.description,
      language: values.language.trim() || null,
      tags: parseTags(values.tags),
    }
    if (mode === 'edit' && template) {
      await useTemplatesStore.getState().update(template.id, payload)
    } else {
      await useTemplatesStore.getState().add(payload)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>
            {mode === 'edit' ? 'Edit template' : 'Add template'}
          </SheetTitle>
          <SheetDescription>
            Templates are starter repositories. The dashboard shows a one-click{' '}
            <code className='rounded bg-muted px-1 text-xs'>git clone</code>{' '}
            command for each.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id='template-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 px-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Vite + React' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='repoUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='https://github.com/user/repo.git'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Used to build the{' '}
                    <code className='rounded bg-muted px-1 text-xs'>
                      git clone
                    </code>{' '}
                    command.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='A minimal starter…'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='language'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <Input placeholder='TypeScript' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='tags'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder='frontend, vite, spa' {...field} />
                  </FormControl>
                  <FormDescription>Comma-separated.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter className='px-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type='submit'
            form='template-form'
            disabled={form.formState.isSubmitting}
          >
            {mode === 'edit' ? 'Save changes' : 'Add template'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
