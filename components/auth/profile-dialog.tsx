'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useProfile } from '@/components/providers/profile-provider'
import { usernameSchema } from '@/lib/onboarding'
import { z } from 'zod'

const profileFormSchema = z.object({
  username: usernameSchema,
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileDialog({ isOpen, onClose }: ProfileDialogProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = useSupabaseClient()
  const { refreshProfile } = useProfile()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
    },
  })

  async function onSubmit(values: ProfileFormValues) {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const { error: userError } = await supabase.from('users').insert({
        id: user.id,
        username: values.username,
        email: user.email!,
        avatar_url: null,
      })

      if (userError) {
        if (userError.code === '23505') {
          toast.error('This username is already taken')
          return
        }
        throw userError
      }

      await refreshProfile()
      onClose()
      router.push('/onboarding')
      router.refresh()
    } catch (error) {
      console.error('Error creating profile:', error)
      toast.error('Could not save profile', {
        description: error instanceof Error ? error.message : 'Try again',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose your username</DialogTitle>
          <DialogDescription>
            Pick a unique handle for your public profile on Clakete.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="your_username" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving…' : 'Continue'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
