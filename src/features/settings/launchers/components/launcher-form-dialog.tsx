import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useLaunchersStore } from '@/stores/launchers-store'
import type { Launcher } from '@/lib/tauri/types'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { IconPicker } from './icon-picker'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().min(1, 'Icon is required'),
  commandTemplate: z
    .string()
    .min(1, 'Command template is required')
    .refine((v) => v.includes('{path}'), '{path} placeholder is required'),
})

type FormValues = z.infer<typeof schema>

type LauncherFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  launcher?: Launcher
}

export function LauncherFormDialog({
  open,
  onOpenChange,
  mode,
  launcher,
}: LauncherFormDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      icon: 'Code',
      commandTemplate: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && launcher) {
        form.reset({
          name: launcher.name,
          icon: launcher.icon,
          commandTemplate: launcher.commandTemplate,
        })
      } else {
        form.reset({ name: '', icon: 'Code', commandTemplate: '' })
      }
    }
  }, [open, mode, launcher, form])

  const onSubmit = async (values: FormValues) => {
    if (mode === 'edit' && launcher) {
      await useLaunchersStore.getState().update(launcher.id, values)
    } else {
      await useLaunchersStore.getState().add(values)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>
            {mode === 'edit' ? 'Edit launcher' : 'Add launcher'}
          </SheetTitle>
          <SheetDescription>
            Launchers open projects in external tools. Use{' '}
            <code className='rounded bg-muted px-1 text-xs'>{'{path}'}</code> as
            a placeholder for the project folder path.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id='launcher-form'
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
                    <Input placeholder='VS Code' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='icon'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <IconPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='commandTemplate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Command template</FormLabel>
                  <FormControl>
                    <Input placeholder='code "{path}"' {...field} />
                  </FormControl>
                  <FormDescription>
                    Must include{' '}
                    <code className='rounded bg-muted px-1 text-xs'>
                      {'{path}'}
                    </code>
                    .
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter className='px-4'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            form='launcher-form'
            disabled={form.formState.isSubmitting}
          >
            {mode === 'edit' ? 'Save changes' : 'Add launcher'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
