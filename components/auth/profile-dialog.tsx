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
import { useDesignMode } from '@/hooks/use-design-mode'
import { cn } from '@/lib/utils'

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

  const designMode = useDesignMode()
  const isGlass = designMode === "glass"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("sm:max-w-md", isGlass && "border-white/10 bg-[#161719]/96 text-white sm:rounded-[24px] backdrop-blur-2xl shadow-[0_28px_64px_-16px_rgba(0,0,0,0.9)]")}>
        <DialogHeader>
          <DialogTitle className={cn(isGlass && "text-white font-semibold")}>Choose your username</DialogTitle>
          <DialogDescription className={cn(isGlass && "text-white/50")}>
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
                  <FormLabel className={cn(isGlass && "text-white/70")}>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="your_username" autoComplete="off" {...field} className={cn(isGlass && "border-white/10 bg-white/[0.04] text-white placeholder:text-white/25")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className={cn("w-full", isGlass ? "rounded-xl bg-white font-semibold text-black hover:bg-white/90" : "")}
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Continue'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
